const apiBaseUrl = 'https://youxueserver-a-wcwgrndlcd.cn-hangzhou.fcapp.run';

function renderDiary(diary, diaryContainer) {
    const diaryCard = document.createElement('div');
    diaryCard.className = 'card my-3';

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const title = document.createElement('h5');
    title.className = 'card-title';
    const firstLineEndIndex = diary.diary.indexOf('\n');
    title.textContent = diary.diary.slice(0, firstLineEndIndex);

    const content = document.createElement('p');
    content.className = 'card-text';
    content.textContent = diary.diary.slice(firstLineEndIndex + 1);
    content.style.display = 'none';

    const toggleContentButton = document.createElement('button');
    toggleContentButton.className = 'btn btn-primary';
    toggleContentButton.textContent = '查看详情';
    toggleContentButton.onclick = function() {
        const displayStyle = content.style.display === 'none' ? 'block' : 'none';
        content.style.display = displayStyle;
        toggleContentButton.textContent = displayStyle === 'none' ? '查看详情' : '收起';
        ratingInput.style.display = displayStyle;
        ratingButton.style.display = displayStyle;
        if (displayStyle === 'block') {
            increaseViewCount(diary.id);
        }
    };

    const ratingInput = document.createElement('input');
    ratingInput.type = 'number';
    ratingInput.className = 'form-control my-2';
    ratingInput.id = 'rating';
    ratingInput.name = 'rating';
    ratingInput.min = '1';
    ratingInput.max = '5';
    ratingInput.placeholder = '评分 (1-5)';
    ratingInput.style.display = 'none';

    const ratingButton = document.createElement('button');
    ratingButton.className = 'btn btn-success';
    ratingButton.textContent = '提交评分';
    ratingButton.style.display = 'none';
    ratingButton.onclick = function() {
        rateDiary(diary.id, ratingInput.value);
    };

    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-danger';
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.onclick = function() {
        deleteDiary(diary.id);
    };

    cardBody.appendChild(title);
    cardBody.appendChild(content);
    cardBody.appendChild(toggleContentButton);
    cardBody.appendChild(ratingInput);
    cardBody.appendChild(ratingButton);
    cardBody.appendChild(deleteButton);

    diaryCard.appendChild(cardBody);
    diaryContainer.appendChild(diaryCard);
}

async function fetchREDiaries() {
    const response = await fetch(`${apiBaseUrl}/diaries/recommended`);
    const data = await response.json();
    const diaryContainer = document.getElementById('diaryContainer');
    diaryContainer.innerHTML = '';
    data.diaries.forEach(diary => {
        renderDiary(diary, diaryContainer);
    });
    const diaryCountElement = document.getElementById('diaryCount');
    diaryCountElement.textContent = `日记总数：${data.diaries.length}`;
    return data.diaries.length;
}

async function increaseViewCount(diaryId) {
    const response = await fetch(`${apiBaseUrl}/diaries/${diaryId}/view`, {
        method: 'PUT'
    });
    const data = await response.json();
    if (!data.success) {
        console.error('Failed to increase view count.');
    }
}

async function rateDiary(diaryId, rating) {
    const response = await fetch(`${apiBaseUrl}/diaries/${diaryId}/rate`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating })
    });
    const data = await response.json();
    if (!data.success) {
        console.error('Failed to update rating.');
    }
}

async function addDiary(event) {
    event.preventDefault();
    const diaryTextElement = document.getElementById('diaryText');
    const diaryText = diaryTextElement.value;
    const authorId = localStorage.getItem('userId');
    const response = await fetch(`${apiBaseUrl}/diaries`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ diary: diaryText, authorId })
    });
    const data = await response.json();
    if (data.diaryId) {
        alert('Diary added successfully!');
        diaryTextElement.value = '';
        fetchREDiaries();
    } else {
        alert('Failed to add diary.');
    }
}

async function deleteDiary(diaryId) {
    const response = await fetch(`${apiBaseUrl}/diaries/${diaryId}`, {
        method: 'DELETE'
    });
    const data = await response.json();
    if (data.success) {
        fetchREDiaries();
    } else {
        console.error('Failed to delete diary.');
    }
}

async function login(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const response = await fetch(`${apiBaseUrl}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.userId) {
        document.getElementById('message').textContent = '登录成功！';
        localStorage.setItem('userId', data.userId);
    } else {
        document.getElementById('message').textContent = '登录失败：' + data.error;
    }
}

async function register(event) {
    event.preventDefault();
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const response = await fetch(`${apiBaseUrl}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.userId) {
        document.getElementById('message').textContent = '注册成功！';
        localStorage.setItem('userId', data.userId);
    } else {
        document.getElementById('message').textContent = '注册失败：' + data.error;
    }
}

function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleButton = document.querySelector('#用户 button');
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        toggleButton.textContent = '切换到注册';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        toggleButton.textContent = '切换到登录';
    }
}

function KMPSearch(pattern, text) {
    if (pattern.length === 0) return 0;

    const lsp = [0];
    for (let i = 1; i < pattern.length; i++) {
        let j = lsp[i - 1];
        while (j > 0 && pattern.charAt(i) !== pattern.charAt(j))
            j = lsp[j - 1];
        if (pattern.charAt(i) === pattern.charAt(j))
            j++;
        lsp.push(j);
    }

    let j = 0;
    for (let i = 0; i < text.length; i++) {
        while (j > 0 && text.charAt(i) !== pattern.charAt(j))
            j = lsp[j - 1];
        if (text.charAt(i) === pattern.charAt(j)) {
            j++;
            if (j === pattern.length)
                return i - (j - 1);
        }
    }
    return -1;
}

async function search(query) {
    const response = await fetch(`${apiBaseUrl}/diaries`);
    const data = await response.json();
    const diaries = data.diaries;
    const result = [];
    diaries.forEach(diary => {
        if (KMPSearch(query, diary.diary) !== -1) {
            result.push(diary);
        }
    });
    return result;
}

async function searchDiary(event) {
    event.preventDefault();
    const searchText = document.getElementById('searchText').value;
    const searchResult = await search(searchText);

    const diaryContainer = document.getElementById('diaryContainer');
    diaryContainer.innerHTML = ''; // 清空日记容器

    searchResult.forEach(diary => {
        renderDiary(diary, diaryContainer);
    });

    // 更新日记的总数
    const diaryCountElement = document.getElementById('diaryCount');
    diaryCountElement.textContent = `搜索结果：${searchResult.length} 条日记`;
}

function toggleSearchForm() {
    const searchForm = document.getElementById('searchForm');
    if (searchForm.style.display === 'none' || searchForm.style.display === '') {
        searchForm.style.display = 'block';
    } else {
        searchForm.style.display = 'none';
    }
}

function toggleWriteForm() {
    const writeForm = document.getElementById('writeForm');
    if (writeForm.style.display === 'none' || writeForm.style.display === '') {
        writeForm.style.display = 'block';
    } else {
        writeForm.style.display = 'none';
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const writeForm = document.getElementById('writeForm');
    const searchForm = document.getElementById('searchForm');
    const toggleButton = document.querySelector('#用户 button');
    const toggleSearchFormButton = document.getElementById('toggleSearchForm');
    const toggleWriteFormButton = document.getElementById('toggleWriteForm');

    if (loginForm) loginForm.addEventListener('submit', login);
    if (registerForm) registerForm.addEventListener('submit', register);
    if (writeForm) writeForm.addEventListener('submit', addDiary);
    if (searchForm) searchForm.addEventListener('submit', searchDiary);
    if (toggleButton) toggleButton.addEventListener('click', toggleForms);
    if (toggleSearchFormButton) toggleSearchFormButton.addEventListener('click', toggleSearchForm);
    if (toggleWriteFormButton) toggleWriteFormButton.addEventListener('click', toggleWriteForm);

    // 为导航链接添加点击事件监听器
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            contentSections.forEach(section => {
                section.style.display = 'none';
            });
            const targetSection = document.querySelector(this.getAttribute('href'));
            targetSection.style.display = 'block';
            if (this.getAttribute('href') === '#日记') {
                fetchREDiaries();
            }
        });
    });

    fetchREDiaries();
});