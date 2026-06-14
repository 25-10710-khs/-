/**
 * script.js
 * 메인 제어 로직
 */

// 전역 변수
let distributionGraph;
let prostheticHand;
let selectedFinger = 'middle';
let currentStrength = 50;
let isProcessing = false;

document.addEventListener('DOMContentLoaded', function() {
    // 초기화
    initializeApp();
    
    // 이벤트 리스너 등록
    setupEventListeners();
    
    // 애니메이션 시작
    startHandAnimation(prostheticHand);
    
    // 초기 그래프 그리기
    updateGraph();
});

/**
 * 앱 초기화
 */
function initializeApp() {
    distributionGraph = new DistributionGraph('distributionCanvas');
    prostheticHand = new ProstheticHand('handCanvas');
    
    // 초기 상태 표시
    updateUI();
}

/**
 * 이벤트 리스너 등록
 */
function setupEventListeners() {
    // 손가락 선택 버튼
    document.querySelectorAll('.finger-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectedFinger = this.getAttribute('data-finger');
            updateFingerSelection();
            updateGraph();
        });
    });
    
    // 강도 슬라이더
    document.getElementById('strengthSlider').addEventListener('input', function() {
        currentStrength = parseInt(this.value);
        updateStrengthDisplay();
        updateGraph();
    });
    
    // 신경신호 처리 버튼
    document.getElementById('processBtn').addEventListener('click', processNeuralSignal);
    
    // 초기화 버튼
    document.getElementById('resetBtn').addEventListener('click', resetApp);
}

/**
 * 손가락 선택 업데이트
 */
function updateFingerSelection() {
    // 버튼 상태 업데이트
    document.querySelectorAll('.finger-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-finger="${selectedFinger}"]`).classList.add('active');
    
    // UI 업데이트
    const fingerNames = {
        thumb: '엄지손가락',
        index: '검지',
        middle: '중지',
        ring: '약지',
        pinky: '새끼손가락'
    };
    
    document.getElementById('selectedFinger').textContent = fingerNames[selectedFinger];
    document.getElementById('statusFinger').textContent = fingerNames[selectedFinger];
}

/**
 * 강도 표시 업데이트
 */
function updateStrengthDisplay() {
    document.getElementById('strengthValue').textContent = currentStrength + '%';
    document.getElementById('statusStrength').textContent = currentStrength + '%';
}

/**
 * 그래프 업데이트
 */
function updateGraph() {
    distributionGraph.draw(selectedFinger, currentStrength);
}

/**
 * UI 전체 업데이트
 */
function updateUI() {
    updateFingerSelection();
    updateStrengthDisplay();
    updateGraph();
}

/**
 * 신경신호 처리
 */
function processNeuralSignal() {
    if (isProcessing) return;
    
    isProcessing = true;
    document.getElementById('processBtn').disabled = true;
    
    // 1단계: 신경신호 감지
    updateStep(1, `신호: ${currentStrength}%`);
    
    setTimeout(() => {
        // 2단계: 신호 필터링
        updateStep(2, '처리중...');
        
        setTimeout(() => {
            // 3단계: Z-Score 계산
            const mean = distributionGraph.fingerMeans[selectedFinger];
            const zScore = distributionGraph.calculateZScore(currentStrength, mean, distributionGraph.sigma);
            updateStep(3, `Z = ${zScore.toFixed(2)}`);
            
            setTimeout(() => {
                // 4단계: 확률 계산
                const probability = distributionGraph.cdf(currentStrength, mean, distributionGraph.sigma);
                updateStep(4, `P(X) = ${(probability * 100).toFixed(1)}%`);
                
                document.getElementById('statusProbability').textContent = (probability * 100).toFixed(1) + '%';
                
                setTimeout(() => {
                    // 5단계: 의사결정
                    const threshold = 0.5;
                    const decision = probability > threshold ? '활성화' : '비활성화';
                    updateStep(5, `판정: ${decision}`);
                    
                    setTimeout(() => {
                        // 6단계: 모터 제어
                        updateStep(6, `상태: 구동중`);
                        
                        // 손가락 애니메이션
                        prostheticHand.animateSelectedFinger(selectedFinger, probability);
                        
                        // 상태 업데이트
                        const status = probability > threshold ? '✓ 활성화됨' : '○ 비활성화';
                        document.getElementById('statusActive').textContent = status;
                        
                        setTimeout(() => {
                            updateStep(6, `상태: 완료`);
                            setTimeout(() => {
                                resetSteps();
                                isProcessing = false;
                                document.getElementById('processBtn').disabled = false;
                            }, 500);
                        }, 800);
                    }, 400);
                }, 400);
            }, 400);
        }, 400);
    }, 400);
}

/**
 * 단계별 정보 업데이트
 */
function updateStep(stepNum, content) {
    const element = document.getElementById(`step${stepNum}`);
    element.textContent = content;
    element.parentElement.classList.add('active');
}

/**
 * 모든 단계 리셋
 */
function resetSteps() {
    for (let i = 1; i <= 6; i++) {
        const element = document.getElementById(`step${i}`);
        element.parentElement.classList.remove('active');
    }
    
    document.getElementById('step1').textContent = '신호: -';
    document.getElementById('step2').textContent = '처리중...';
    document.getElementById('step3').textContent = 'Z = -';
    document.getElementById('step4').textContent = 'P(X) = -';
    document.getElementById('step5').textContent = '판정: -';
    document.getElementById('step6').textContent = '상태: 대기';
    document.getElementById('statusProbability').textContent = '-';
    document.getElementById('statusActive').textContent = '대기중';
}

/**
 * 앱 초기화
 */
function resetApp() {
    // 상태 초기화
    currentStrength = 50;
    selectedFinger = 'middle';
    isProcessing = false;
    
    // UI 초기화
    document.getElementById('strengthSlider').value = 50;
    updateUI();
    
    // 손 초기화
    prostheticHand.reset();
    prostheticHand.draw();
    
    // 단계 초기화
    resetSteps();
    
    // 버튼 활성화
    document.getElementById('processBtn').disabled = false;
    
    console.log('앱이 초기화되었습니다.');
}

/**
 * 손 애니메이션 루프
 */
function startHandAnimation(hand) {
    const animate = () => {
        hand.draw();
        requestAnimationFrame(animate);
    };
    animate();
}

// 창 크기 조정 시 캔버스 크기 조정
window.addEventListener('resize', function() {
    // 필요시 캔버스 크기 조정
});

console.log('전자의수 시연 앱이 로드되었습니다.');
