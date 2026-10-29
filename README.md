# Exercice de triage (EMR) – données fictives

Exercice de formation pour s'entraîner aux écrans de triage d'un dossier informatisé des urgences, sur téléphone ou sur ordinateur.

- Tous les patients sont fictifs. Ce n'est pas le système CURY.
- Rien n'est envoyé : tout reste dans le navigateur. Recharger la page remet l'exercice à zéro.
- Ouvrir : https://joojeong.github.io/exercise-triage/
- Sans internet : après une première ouverture avec internet, l'exercice s'ouvre aussi sans internet sur le même appareil et le même navigateur (l'écran de départ affiche « ✓ Gardé dans ce navigateur »). Sur iPhone, l'ajouter à l'écran d'accueil depuis Safari, puis ouvrir l'icône une fois avec internet (sinon Safari peut effacer la copie après une semaine sans l'ouvrir). Partager le lien avec le « / » final : sans lui, l'adresse ne s'ouvre pas sans internet.

Préparé pour la formation sur les dossiers médicaux (projet KOICA ; PMC : Seoul National University Hospital), octobre 2026.

## Fichiers

- `index.html` : l'exercice (une seule page, sans fichier extérieur).
- `sw.js` : garde la page dans le navigateur. Avec internet, la page est reprise du site ; si elle n'est pas arrivée en entier en 3 secondes, la copie gardée s'affiche et sera remplacée dès qu'une page arrive en entier. Sans internet, la copie gardée.
- `manifest.webmanifest` et les icônes : pour l'ajout à l'écran d'accueil.

Pour une nouvelle version, il suffit de remplacer `index.html`. Si le manifeste ou les icônes changent, changer aussi `VERSION` dans `sw.js` (v1 → v2). Pour retirer le mode hors connexion, remplacer `sw.js` par un fichier qui efface ses copies et se désinscrit (supprimer `sw.js` ne suffit pas : les appareils déjà servis gardent l'ancien).
