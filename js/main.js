// НАЗНАЧАЕМ ОБРАБОТЧИКИ СОБЫТИЙ
document.addEventListener('DOMContentLoaded', function() {
    if (checkSession()) {
        showContent();
    } else {
        document.getElementById('password').focus();
    }
    
    document.getElementById('age').addEventListener('input', filterAndDisplayObjects);
    document.getElementById('gender').addEventListener('change', filterAndDisplayObjects);
    document.getElementById('nationality').addEventListener('change', filterAndDisplayObjects);
    document.getElementById('hasConviction').addEventListener('change', filterAndDisplayObjects);
});