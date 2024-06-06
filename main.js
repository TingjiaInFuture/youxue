const apiBaseUrl = 'https://youxueserver-a-wcwgrndlcd.cn-hangzhou.fcapp.run';

// Function to render a diary
function renderDiary(diary, diaryContainer) {
    const diaryCard = document.createElement('div');
    diaryCard.className = 'card my-3';

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const diaryText = diary.diary;
    const firstLineEndIndex = diaryText.indexOf('\n');
    const secondLineEndIndex = diaryText.indexOf('\n', firstLineEndIndex + 1);

    const location = document.createElement('h6');
    location.className = 'card-subtitle mb-2 text-muted';
    location.textContent = diaryText.slice(0, firstLineEndIndex);

    const title = document.createElement('h5');
    title.className = 'card-title';
    title.textContent = diaryText.slice(firstLineEndIndex + 1, secondLineEndIndex);

    const content = document.createElement('p');
    content.className = 'card-text';
    content.textContent = diaryText.slice(secondLineEndIndex + 1);
    content.style.display = 'none';

    const toggleContentButton = document.createElement('button');
    toggleContentButton.className = 'btn btn-primary';
    toggleContentButton.textContent = '查看详情';
    toggleContentButton.onclick = function () {
        const displayStyle = content.style.display === 'none' ? 'block' : 'none';
        content.style.display = displayStyle;
        toggleContentButton.textContent = displayStyle === 'none' ? '查看详情' : '收起';
    };

    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-danger';
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.onclick = function () {
        deleteDiary(diary.id);
    };

    cardBody.appendChild(location);
    cardBody.appendChild(title);
    cardBody.appendChild(content);
    cardBody.appendChild(toggleContentButton);
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

// Function to add a diary
async function addDiary(event) {
    event.preventDefault();
    const diaryLocation = document.getElementById('diaryLocation').value;
    const diaryTitle = document.getElementById('diaryTitle').value;
    const diaryContent = document.getElementById('diaryContent').value;
    const authorId = localStorage.getItem('userId');

    const diaryText = `${diaryLocation}\n${diaryTitle}\n${diaryContent}`;

    const response = await fetch(`${apiBaseUrl}/diaries`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ diary: diaryText, authorId })
    });

    document.getElementById('writeForm').reset();
    fetchREDiaries();

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

// Function to toggle the write form and set the location
function toggleWriteForm() {
    const writeForm = document.getElementById('writeForm');
    const diaryLocation = document.getElementById('diaryLocation');
    if (writeForm.style.display === 'none' || writeForm.style.display === '') {
        diaryLocation.value = area; // Set the area as location
        writeForm.style.display = 'block';
    } else {
        writeForm.style.display = 'none';
    }
}

// Initialize the area variable
let area = 'Beijing'; // This should be dynamically set based on application's logic
function updateArea(newArea) {
    area = newArea;
}
const towrite =function (newArea) {
    updateArea(newArea);

    // Hide all content sections
    const contentSections = document.querySelectorAll('.content-section');
    contentSections.forEach(section => {
        section.style.display = 'none';
    });

    // Show the diary section
    const diarySection = document.querySelector('#日记');
    diarySection.style.display = 'block';

    // Fetch and render diaries
    fetchREDiaries();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('diaryLocation').value = area;


    // 为导航链接添加点击事件监听器
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    navLinks.forEach(link => {
        link.addEventListener('click', function (event) {
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

