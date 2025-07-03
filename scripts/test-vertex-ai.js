#!/usr/bin/env node

/**
 * Vertex AI Search 接続テストスクリプト
 * 
 * 使用方法:
 * node scripts/test-vertex-ai.js
 */

require('dotenv').config({ path: '.env.local' });
const { SearchServiceClient } = require('@google-cloud/discoveryengine');
const { GoogleAuth } = require('google-auth-library');

// 設定の読み込み
const config = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'global',
  engineId: process.env.VERTEX_AI_SEARCH_ENGINE_ID,
  servingConfigId: process.env.VERTEX_AI_SERVING_CONFIG_ID || 'default_config',
};

console.log('🔧 Vertex AI Search 接続テスト開始\n');

// 設定の確認
function validateConfig() {
  console.log('📋 設定確認:');
  console.log(`  プロジェクトID: ${config.projectId || '❌ 未設定'}`);
  console.log(`  ロケーション: ${config.location}`);
  console.log(`  エンジンID: ${config.engineId || '❌ 未設定'}`);
  console.log(`  認証ファイル: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || '❌ 未設定'}\n`);

  const missingConfig = [];
  if (!config.projectId) missingConfig.push('GOOGLE_CLOUD_PROJECT_ID');
  if (!config.engineId) missingConfig.push('VERTEX_AI_SEARCH_ENGINE_ID');
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) missingConfig.push('GOOGLE_APPLICATION_CREDENTIALS');

  if (missingConfig.length > 0) {
    console.error('❌ 必要な環境変数が設定されていません:');
    missingConfig.forEach(key => console.error(`   - ${key}`));
    console.error('\n.env.local ファイルを確認してください。');
    process.exit(1);
  }

  console.log('✅ 設定確認完了\n');
}

// 認証テスト
async function testAuthentication() {
  console.log('🔐 認証テスト:');
  
  try {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    const projectId = await auth.getProjectId();
    
    console.log(`  認証済みプロジェクト: ${projectId}`);
    console.log('✅ 認証成功\n');
    
    return client;
  } catch (error) {
    console.error('❌ 認証失敗:', error.message);
    console.error('\nサービスアカウントキーを確認してください。');
    process.exit(1);
  }
}

// API接続テスト
async function testApiConnection() {
  console.log('🌐 API接続テスト:');
  
  try {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = new SearchServiceClient({ auth });
    
    // Serving Configのパスを構築
    const servingConfig = client.projectLocationCollectionEngineServingConfigPath(
      config.projectId,
      config.location,
      'default_collection',
      config.engineId,
      config.servingConfigId
    );

    console.log(`  Serving Config パス: ${servingConfig}`);
    console.log('✅ API接続設定完了\n');
    
    return client;
  } catch (error) {
    console.error('❌ API接続失敗:', error.message);
    console.error('\nVertex AI Search APIが有効化されているか確認してください。');
    process.exit(1);
  }
}

// 検索テスト
async function testSearch(client) {
  console.log('🔍 検索テスト:');
  
  const testQueries = [
    '田中太郎 東京都渋谷区',
    '営業部長 株式会社',
    '電話番号 会社'
  ];

  for (const query of testQueries) {
    console.log(`\n  テストクエリ: "${query}"`);
    
    try {
      const servingConfig = client.projectLocationCollectionEngineServingConfigPath(
        config.projectId,
        config.location,
        'default_collection',
        config.engineId,
        config.servingConfigId
      );

      const request = {
        servingConfig,
        query: { text: query },
        pageSize: 5,
        contentSearchSpec: {
          snippetSpec: {
            returnSnippet: true,
            maxSnippetCount: 2,
          },
        },
      };

      console.log('  📤 検索リクエスト送信中...');
      const startTime = Date.now();
      
      const [response] = await client.search(request);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`  ⏱️  レスポンス時間: ${duration}ms`);
      console.log(`  📊 検索結果数: ${response.results?.length || 0}件`);
      
      if (response.results && response.results.length > 0) {
        console.log('  📄 サンプル結果:');
        const firstResult = response.results[0];
        console.log(`    - タイトル: ${firstResult.document?.title || 'N/A'}`);
        console.log(`    - URI: ${firstResult.document?.uri || 'N/A'}`);
        if (firstResult.snippet) {
          console.log(`    - スニペット: ${firstResult.snippet.substring(0, 100)}...`);
        }
      } else {
        console.log('  ⚠️  検索結果が見つかりませんでした');
        console.log('    データソースが正しく設定されているか確認してください');
      }
      
    } catch (error) {
      console.error(`  ❌ 検索エラー: ${error.message}`);
      
      if (error.code === 5) {
        console.error('    Engine IDまたはServing Configが見つかりません');
      } else if (error.code === 7) {
        console.error('    権限が不足しています');
      } else if (error.code === 3) {
        console.error('    無効なリクエストです');
      }
    }
  }
  
  console.log('\n✅ 検索テスト完了');
}

// パフォーマンステスト
async function testPerformance(client) {
  console.log('\n⚡ パフォーマンステスト:');
  
  const testQuery = '田中太郎 東京都 会社';
  const iterations = 5;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    try {
      const servingConfig = client.projectLocationCollectionEngineServingConfigPath(
        config.projectId,
        config.location,
        'default_collection',
        config.engineId,
        config.servingConfigId
      );

      const request = {
        servingConfig,
        query: { text: testQuery },
        pageSize: 10,
      };

      const startTime = Date.now();
      const [response] = await client.search(request);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      times.push(duration);
      
      console.log(`  テスト ${i + 1}/${iterations}: ${duration}ms`);
      
    } catch (error) {
      console.error(`  ❌ テスト ${i + 1} 失敗: ${error.message}`);
    }
  }
  
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`\n  📊 パフォーマンス結果:`);
    console.log(`    平均レスポンス時間: ${avgTime.toFixed(2)}ms`);
    console.log(`    最短レスポンス時間: ${minTime}ms`);
    console.log(`    最長レスポンス時間: ${maxTime}ms`);
  }
}

// トラブルシューティング情報
function showTroubleshooting() {
  console.log('\n🔧 トラブルシューティング:\n');
  
  console.log('よくある問題と解決策:');
  console.log('');
  console.log('1. 認証エラー');
  console.log('   - サービスアカウントキーが正しい場所にあるか確認');
  console.log('   - 環境変数 GOOGLE_APPLICATION_CREDENTIALS の設定確認');
  console.log('   - サービスアカウントに適切な権限があるか確認');
  console.log('');
  console.log('2. Engine ID が見つからない');
  console.log('   - Google Cloud Console でEngine IDを確認');
  console.log('   - Search App が正しく作成されているか確認');
  console.log('');
  console.log('3. 検索結果が少ない/ない');
  console.log('   - データソースが正しく設定されているか確認');
  console.log('   - インデックス作成が完了しているか確認');
  console.log('   - 検索クエリを調整');
  console.log('');
  console.log('4. レスポンスが遅い');
  console.log('   - データソースのサイズを確認');
  console.log('   - 検索クエリを最適化');
  console.log('   - pageSize を調整');
}

// メイン関数
async function main() {
  try {
    validateConfig();
    await testAuthentication();
    const client = await testApiConnection();
    await testSearch(client);
    await testPerformance(client);
    
    console.log('\n🎉 すべてのテストが完了しました！');
    console.log('Vertex AI Searchの準備ができています。\n');
    
  } catch (error) {
    console.error('\n💥 テスト中にエラーが発生しました:', error);
    showTroubleshooting();
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  main();
}