javascript
const menuButton = document.getElementById("menuButton");
const navigation = document.getElementById("navigation");

if (menuButton && navigation) {

    menuButton.addEventListener("click", function () {

        const isOpen = navigation.classList.toggle("open");

        menuButton.setAttribute("aria-expanded", isOpen);

        menuButton.textContent = isOpen ? "✕" : "☰";

    });

    navigation.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", function () {

            navigation.classList.remove("open");

            menuButton.setAttribute("aria-expanded", "false");

            menuButton.textContent = "☰";

        });

    });

}
// MEDICYCLE MOBILE NAVIGATION FIX
document.addEventListener("DOMContentLoaded", function () {
    const oldButton = document.getElementById("menuButton");
    const navigation = document.getElementById("navigation");

    if (!oldButton || !navigation) return;

    // Replace button to remove any conflicting old click listeners
    const menuButton = oldButton.cloneNode(true);
    oldButton.replaceWith(menuButton);

    menuButton.addEventListener("click", function (event) {
        event.stopPropagation();

        const isOpen = navigation.classList.toggle("open");

        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.innerHTML = isOpen ? "✕" : "☰";
    });

    // Close menu after selecting a link
    navigation.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            navigation.classList.remove("open");
            menuButton.setAttribute("aria-expanded", "false");
            menuButton.innerHTML = "☰";
        });
    });

    // Close menu when clicking outside
    document.addEventListener("click", function (event) {
        if (
            !navigation.contains(event.target) &&
            !menuButton.contains(event.target)
        ) {
            navigation.classList.remove("open");
            menuButton.setAttribute("aria-expanded", "false");
            menuButton.innerHTML = "☰";
        }
    });
});
