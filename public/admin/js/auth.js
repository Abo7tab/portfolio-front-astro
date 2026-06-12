function checkAuth() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = 'login.html';
    }
}

function checkGuest() {
    const token = localStorage.getItem('auth_token');
    if (token) {
        window.location.href = 'index.html';
    }
}
