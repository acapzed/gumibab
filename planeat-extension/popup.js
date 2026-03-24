document.addEventListener('DOMContentLoaded', () => {
  const dateDisplay = document.getElementById('date-display');
  const menuContainer = document.getElementById('menu-container');
  const loadingElement = document.getElementById('loading');
  const errorElement = document.getElementById('error');
  
  const btnPrev = document.getElementById('btn-prev-day');
  const btnNext = document.getElementById('btn-next-day');
  const tabBtns = document.querySelectorAll('.tab-btn');

  // 모달 요소들
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-image');
  const modalClose = document.querySelector('.modal-close');

  const kstOffset = 9 * 60 * 60 * 1000;
  let currentDate = new Date(Date.now() + kstOffset);
  let currentMealCd = "2"; 

  // 모달 이벤트 리스너
  modalClose.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  function updateView() {
    renderDate();
    fetchMenu();
  }

  function renderDate() {
    const month = String(currentDate.getUTCMonth() + 1);
    const day = String(currentDate.getUTCDate());
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][currentDate.getUTCDay()];
    
    dateDisplay.textContent = `${month}월 ${day}일 (${dayOfWeek})`;
  }

  function getFormattedDate() {
    const year = currentDate.getUTCFullYear();
    const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  btnPrev.addEventListener('click', () => {
    currentDate.setUTCDate(currentDate.getUTCDate() - 1);
    updateView();
  });

  btnNext.addEventListener('click', () => {
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    updateView();
  });

  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentMealCd = e.target.getAttribute('data-meal');
      updateView();
    });
  });

  async function fetchMenu() {
    // 로딩 시 기존 내용을 즉시 지우지 않고 반투명 처리(dimmed) 표기하여 번쩍임 방지
    menuContainer.classList.add('dimmed');
    errorElement.classList.add('hidden');
    loadingElement.classList.remove('hidden');

    const dateStr = getFormattedDate();

    try {
      const apiUrl = `https://m.planeatchoice.net/v2/portal/dailyMenu?busiCd=RH3_K_001&compCd=K_KR_011&storCd=CAF38&orgTreeId=0:2:3&saleDt=${dateStr}&mealCd=${currentMealCd}`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      loadingElement.classList.add('hidden');
      menuContainer.classList.remove('dimmed');
      renderMenu(data);
    } catch (error) {
      console.error('메뉴 가져오기 실패:', error);
      loadingElement.classList.add('hidden');
      menuContainer.classList.remove('dimmed');
      menuContainer.innerHTML = '';
      errorElement.textContent = '메뉴를 불러오는데 실패했습니다. 사내망 연결 상태 등을 확인해주세요.';
      errorElement.classList.remove('hidden');
    }
  }

  function renderMenu(data) {
    if (!data || !data.ds || data.ds.length === 0) {
      menuContainer.innerHTML = '<div class="error">해당 날짜/식사에 등록된 메뉴가 없습니다.</div>';
      return;
    }

    menuContainer.innerHTML = '';
    let hasValidItems = false;
    const allowedCorners = ['코너 A', '코너 B'];

    data.ds.forEach(menuItem => {
      const cornerName = menuItem.cnrNm || '';
      if (!allowedCorners.includes(cornerName)) return;
      hasValidItems = true;

      const mainTitle = menuItem.itemNmDp || '메뉴명 없음';
      
      // 이미지 URL 보정
      let imageUrl = null;
      if (menuItem.fileUpload && menuItem.fileUpload.length > 0) {
        imageUrl = menuItem.fileUpload[0].url.replace('http://planeatchoice.net', 'https://m.planeatchoice.net');
      }
      
      const kcal = menuItem.totCalorie || menuItem.calorie || 0;
      const protein = menuItem.protein || 0;
      const carbs = menuItem.carbohydrates || 0;
      const fat = menuItem.fat || 0;

      let sideDishesHtml = '';
      if (menuItem.dailySubMenuDtos && menuItem.dailySubMenuDtos.length > 0) {
        const sideDishes = menuItem.dailySubMenuDtos.map(subItem => `<li>${subItem.subItemNmDp}</li>`).join('');
        sideDishesHtml = `
          <div class="menu-details">
            <ul>${sideDishes}</ul>
          </div>
        `;
      }

      let imageHtml = '';
      if (imageUrl) {
        imageHtml = `<img src="${imageUrl}" alt="${mainTitle}" class="menu-image">`;
      } else {
        imageHtml = `<div class="menu-image-placeholder">이미지 없음</div>`;
      }

      const el = document.createElement('div');
      el.className = 'menu-item';
      
      el.innerHTML = `
        <div class="corner-badge">${cornerName.replace('코너 ', '')}메뉴</div>
        ${imageHtml}
        <div class="menu-title">${mainTitle}</div>
        ${sideDishesHtml}
        <div class="nutrients">
          <span class="nutrient-badge kcal-badge">${kcal} kcal</span>
          <span class="nutrient-badge">탄수화물 ${Math.round(carbs)}g</span>
          <span class="nutrient-badge">단백질 ${Math.round(protein)}g</span>
          <span class="nutrient-badge">지방 ${Math.round(fat)}g</span>
        </div>
      `;
      
      menuContainer.appendChild(el);

      // 이미지 요소에 이벤트 리스너 추가
      const img = el.querySelector('img.menu-image');
      if (img) {
        // 클릭 시 모달 띄우기
        img.addEventListener('click', () => {
          modalImg.src = img.src;
          modal.classList.remove('hidden');
        });
        
        // 에러 시 플레이스홀더로 교체
        img.addEventListener('error', function() {
          const placeholder = document.createElement('div');
          placeholder.className = 'menu-image-placeholder';
          placeholder.textContent = '이미지를 불러올 수 없습니다';
          this.parentNode.replaceChild(placeholder, this);
        });
      }
    });

    if (!hasValidItems) {
      menuContainer.innerHTML = '<div class="error">해당 시간에 1, 2메뉴(코너A, B) 정보가 없습니다.</div>';
    }
  }

  updateView();
});
