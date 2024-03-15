const apiBaseUrl = 'http://127.0.0.1:9000';

async function fetchDiaries() {
    const response = await fetch(`${apiBaseUrl}/diaries/recommended`);
    const data = await response.json();
    const diaryContainer = document.getElementById('diaryContainer');
    // 清空日记容器
    diaryContainer.innerHTML = '';
    data.diaries.forEach(diary => {
        const diaryElement = document.createElement('div');
        const title = document.createElement('h2');
        const content = document.createElement('p');
        const ratingInput = document.createElement('input');
        const ratingButton = document.createElement('button');
        const firstLineEndIndex = diary.diary.indexOf('\n');
        title.textContent = diary.diary.slice(0, firstLineEndIndex);
        content.textContent = diary.diary.slice(firstLineEndIndex + 1);
        content.style.display = 'none';
        ratingInput.type = 'number';
        ratingInput.id = 'rating';
        ratingInput.name = 'rating';
        ratingInput.min = '1';
        ratingInput.max = '5';
        ratingInput.style.display = 'none';  // 将评分输入框默认设置为隐藏
        ratingButton.textContent = '提交评分';
        ratingButton.style.display = 'none';  // 将评分按钮默认设置为隐藏
        ratingButton.onclick = function() {
            rateDiary(diary.id, document.getElementById('rating').value);
        };
        title.addEventListener('click', function() {
            const displayStyle = content.style.display === 'none' ? 'block' : 'none';
            content.style.display = displayStyle;
            ratingInput.style.display = displayStyle;  // 将评分输入框的显示状态与日记内容的显示状态绑定在一起
            ratingButton.style.display = displayStyle;  // 将评分按钮的显示状态与日记内容的显示状态绑定在一起
            increaseViewCount(diary.id);
        });
        diaryElement.appendChild(title);
        diaryElement.appendChild(content);
        diaryElement.appendChild(ratingInput);
        diaryElement.appendChild(ratingButton);
        diaryContainer.appendChild(diaryElement);
    });
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
    const diaryText = document.getElementById('diaryText').value;
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
    } else {
        alert('Failed to add diary.');
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
        // 在这里保存用户ID
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
        // 在这里保存用户ID
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

window.onload = function () {
    // 获取所有的导航链接和内容部分
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');

    // 为每个导航链接添加点击事件监听器
    navLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            // 阻止链接的默认行为
            event.preventDefault();

            // 隐藏所有的内容部分
            contentSections.forEach(section => {
                section.style.display = 'none';
            });

            // 显示被点击的链接对应的内容部分
            const targetSection = document.querySelector(this.getAttribute('href'));
            targetSection.style.display = 'block';

            // 如果是“游学日记管理”链接，那么获取日记
            if (this.getAttribute('href') === '#日记') {
                fetchDiaries();
            }
        });
    });
};
