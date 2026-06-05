// --- データの状態管理 ---
let scores = [new Array(36).fill(null), new Array(36).fill(null)];
let currentIndexes = [0, 0];
let currentTab = 0;
let selectedDistances = ['30m', '30m'];

// --- 画面切り替えと保存の処理 ---

/**
 * 画面を切り替える
 */
function showScreen(screenId) {
  document.getElementById('top-screen').classList.add('hidden');
  document.getElementById('input-screen').classList.add('hidden');
  document.getElementById(screenId).classList.remove('hidden');
}

/**
 * 1つのタブ（36射分）のデータから、各エンド（6射）の合計点を計算し、「47 / 39 / 49...」の文字列にする関数
 */
function formatEndTotals(tabScores) {
  if (!tabScores) return '- / - / - / - / - / -';
  let endTotals = [];

  for (let end = 0; end < 6; end++) {
    let sum = 0;
    let hasInput = false;

    for (let shot = 0; shot < 6; shot++) {
      let val = tabScores[end * 6 + shot];
      if (val !== null) {
        hasInput = true;
        if (val === 'X') sum += 10;
        else if (val === 'M') sum += 0;
        else sum += parseInt(val, 10);
      }
    }
    // 入力があればその合計を、なければ「-」を追加
    endTotals.push(hasInput ? sum : '-');
  }
  return endTotals.join(' / ');
}

/**
 * トップ画面に保存されたデータを表示する
 */
function renderTopScreen() {
  const listContainer = document.getElementById('record-list');
  listContainer.innerHTML = ''; // 一旦クリア

  let savedRecords = JSON.parse(localStorage.getItem('archery_records')) || [];

  if (savedRecords.length === 0) {
    listContainer.innerHTML = '<p style="text-align:center; color:#999; margin-top:20px;">まだ記録がありません</p>';
    return;
  }

savedRecords.forEach((record, index) => {
    const card = document.createElement('div');
    card.className = 'record-card';

    const frontEndsText = formatEndTotals(record.scores ? record.scores[0] : null);
    const backEndsText = formatEndTotals(record.scores ? record.scores[1] : null);

    card.innerHTML = `
      <div class="record-header">
        <span class="record-date">${record.date}</span>
        <span class="record-score"><span class="record-GT">Grand Total：</span>${record.totalScore}</span>
      </div>
      <div class="record-ends">
        <div class="record-ends-text">
          <div>${record.distanceFront}: ${frontEndsText}</div>
          <div>${record.distanceBack}: ${backEndsText}</div>
        </div>
        <div class="record-buttons">
          <button class="btn-export-sheet" title="スプレッドシートへ送信" onclick="sendToSpreadsheet(${index})"></button>
          <button class="btn-delete-record" title="記録を削除" onclick="deleteRecord(${index})"></button>
        </div>
      </div>
    `;
    listContainer.appendChild(card);
  });
}

/**
 * 新しく記録を始める（データをリセットして入力画面へ）
 */
function startNewRecord() {
  scores = [new Array(36).fill(null), new Array(36).fill(null)];
  currentIndexes = [0, 0];
  selectedDistances = ['30m', '30m'];
  switchTab(0);
  document.getElementById('distance').value = '30m';
  updateDisplay();
  showScreen('input-screen');
}

/**
 * 入力したスコアを保存してトップ画面に戻る
 */
function saveScore() {
  const grandTotal = document.getElementById('grand-total').textContent;
  
  // 日時の取得（例: 2026/6/1 14:30）
  const now = new Date();
  const dateStr = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

  // 保存する1回分のデータ
  const record = {
    date: dateStr,
    distanceFront: selectedDistances[0],
    distanceBack: selectedDistances[1],
    totalScore: grandTotal,
    scores: scores // 各射の詳細データも後々使えるように一応保存
  };

  // 過去の記録を読み込み、一番上に新しい記録を追加して保存
  let savedRecords = JSON.parse(localStorage.getItem('archery_records')) || [];
  savedRecords.unshift(record); // 配列の先頭に追加
  localStorage.setItem('archery_records', JSON.stringify(savedRecords));

  // トップ画面を更新して切り替え
  renderTopScreen();
  showScreen('top-screen');
}

// --- 入力・操作の処理（今までと同じ） ---

function handleKeyPress(value) {
  let index = currentIndexes[currentTab];
  if (index >= 36) return;
  scores[currentTab][index] = value;
  currentIndexes[currentTab]++;
  updateDisplay();
}

function undoLastShot() {
  let index = currentIndexes[currentTab];
  if (index === 0) return;
  currentIndexes[currentTab]--;
  scores[currentTab][currentIndexes[currentTab]] = null;
  updateDisplay();
}

function switchTab(tabIndex) {
  currentTab = tabIndex;
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab, index) => {
    if (index === tabIndex) tab.classList.add('active');
    else tab.classList.remove('active');
  });
  document.getElementById('distance').value = selectedDistances[currentTab];
  updateDisplay();
}

// --- 画面表示の処理（今までと同じ） ---

function updateDisplay() {
  let grandTotal = 0;
  for (let t = 0; t < 2; t++) {
    for (let i = 0; i < 36; i++) {
      let val = scores[t][i];
      if (val !== null) {
        if (val === 'X') grandTotal += 10;
        else if (val === 'M') grandTotal += 0;
        else grandTotal += parseInt(val, 10);
      }
    }
  }
  document.getElementById('grand-total').textContent = grandTotal;

  const rows = document.querySelectorAll('.score-table tbody tr');
  const currentScores = scores[currentTab];

  for (let end = 0; end < 6; end++) {
    let endTotal = 0;
    let hasInputInThisEnd = false;
    const cells = rows[end].querySelectorAll('td');

    for (let shot = 0; shot < 6; shot++) {
      const scoreIndex = end * 6 + shot;
      const scoreValue = currentScores[scoreIndex];
      cells[shot].textContent = scoreValue !== null ? scoreValue : '';

      if (scoreValue !== null) {
        hasInputInThisEnd = true;
        let numericValue = 0;
        if (scoreValue === 'X') numericValue = 10;
        else if (scoreValue === 'M') numericValue = 0;
        else numericValue = parseInt(scoreValue, 10);
        endTotal += numericValue;
      }
    }
    cells[6].textContent = hasInputInThisEnd ? endTotal : '';
  }
}

// --- 初期設定 ---

document.addEventListener('DOMContentLoaded', () => {
  // ボタン類のイベント設定
  const keys = document.querySelectorAll('.keypad-section .key');
  keys.forEach(key => key.addEventListener('click', () => handleKeyPress(key.textContent)));
  
  document.querySelector('.btn-undo').addEventListener('click', undoLastShot);
  document.querySelector('.btn-save').addEventListener('click', saveScore); // 保存ボタンの設定
  document.getElementById('btn-new-record').addEventListener('click', startNewRecord); // 新規記録ボタンの設定

  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab, index) => tab.addEventListener('click', () => switchTab(index)));

  const distanceSelect = document.getElementById('distance');
  distanceSelect.addEventListener('change', () => {
    selectedDistances[currentTab] = distanceSelect.value;
  });
  //追記
  const sheetInput = document.getElementById('target-sheet');
  sheetInput.value = localStorage.getItem('archery_target_sheet') || ''; 
  sheetInput.addEventListener('change', () => localStorage.setItem('archery_target_sheet', sheetInput.value)); // 変更されたら記憶する
  //追記ここまで

  // アプリ起動時はトップ画面を表示する
  renderTopScreen();
  showScreen('top-screen');
});

/**
 * スプレッドシート用に、エンドごとの合計を「配列」として計算する関数
 */
function calculateEndTotalsArray(tabScores) {
  if (!tabScores) return ['', '', '', '', '', ''];
  let endTotals = [];
  for (let end = 0; end < 6; end++) {
    let sum = 0;
    let hasInput = false;
    for (let shot = 0; shot < 6; shot++) {
      let val = tabScores[end * 6 + shot];
      if (val !== null) {
        hasInput = true;
        if (val === 'X') sum += 10;
        else if (val === 'M') sum += 0;
        else sum += parseInt(val, 10);
      }
    }
    // 未入力の場合は空文字（スプレッドシートで空欄になる）
    endTotals.push(hasInput ? sum : '');
  }
  return endTotals;
}


function sendToSpreadsheet(index) {
  // ★ここにGASのウェブアプリURLを貼り付け★
  const gasUrl = "https://script.google.com/macros/s/AKfycbwob291RyfF77wmbLf28r_MbX8k4Zt6NEuf2UkmP2BlyykYkDL_NAefAdiNYIdYKhS-yw/exec";

  let savedRecords = JSON.parse(localStorage.getItem('archery_records')) || [];
  let record = savedRecords[index];
  if (!record) return;

  // 画面下部の入力欄からシート番号を取得する
  const sheetNumInput = document.getElementById('target-sheet').value;
  
  if (!sheetNumInput) {
    alert("シート番号が設定されていません。");
    return; 
  }

  // 送信するデータの準備
  const frontDist = record.distanceFront.replace('m', '');
  const backDist = record.distanceBack.replace('m', '');
  const frontTotals = calculateEndTotalsArray(record.scores ? record.scores[0] : null);
  const backTotals = calculateEndTotalsArray(record.scores ? record.scores[1] : null);

  // 入力されたシート番号（sheetNumber）を追加
  const payload = {
    sheetNumber: sheetNumInput,
    date: record.date,
    frontDist: frontDist,
    backDist: backDist,
    frontTotals: frontTotals,
    backTotals: backTotals
  };

  // GASへデータを送信（裏側で非同期に処理）
  fetch(gasUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify(payload)
  })
  .then(response => response.text())
  .then(text => {
    // GAS側で空き行が見つからなかった場合などのエラー処理（後から通知）
    if (text.includes("Error")) {
      alert(`送信エラー: ${text}\nシートの空き行や番号を確認してください。`);
    }
  })
  .catch(error => {
    console.error('送信エラー:', error);
  });

  // 完了メッセージ
  alert(`シート${sheetNumInput}へスコアを送信しました\n※反映には時間がかかることがあります`);
}

/**
 * 確認ポップアップを出し、記録を削除する関数
 */
function deleteRecord(index) {
  // confirm() で「はい」が押された時だけ中の処理を実行する
  if (confirm('記録を削除しますか？')) {
    let savedRecords = JSON.parse(localStorage.getItem('archery_records')) || [];
    
    // 配列から該当のインデックスのデータを1つだけ削除する
    savedRecords.splice(index, 1);
    
    // 削除後の配列をローカルストレージに上書き保存
    localStorage.setItem('archery_records', JSON.stringify(savedRecords));
    
    // トップ画面を再描画して、画面上からも消す
    renderTopScreen();
  }
}