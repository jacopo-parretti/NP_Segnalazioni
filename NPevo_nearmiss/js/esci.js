(function () {
    'use strict';

    try {
        sessionStorage.clear();
    } finally {
        window.location.replace('../login.php');
    }
})();
