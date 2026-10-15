/* Αρχείο: font_toggle.js
   Λειτουργία: Κυκλική εναλλαγή γραμματοσειρών και εφαρμογή στυλ προσβασιμότητας.
   Συνεργάζεται με το αρχείο: alternate_fonts.css
   
   localStorage: Αποθηκεύει την επιλογή ξεχωριστά για κάθε σελίδα,
   χρησιμοποιώντας το pathname ως μέρος του key.
*/

document.addEventListener('DOMContentLoaded', () => {

    // Λίστα με τις κλάσεις που αντιστοιχούν στις γραμματοσειρές στο CSS
    // null = Η αρχική σχεδίαση (χωρίς επιπλέον κλάση)
    const fontModes = [
        null,                // 0: Default (Αρχικός σχεδιασμός)
        'font-opendyslexic', // 1: OpenDyslexic + BDA Styles
        'font-verdana',      // 2: Verdana + BDA Styles
        'font-tahoma',       // 3: Tahoma + BDA Styles
        'font-century'       // 4: Century Gothic + BDA Styles
    ];

    // Ονόματα για εμφάνιση στο Tooltip (βοήθεια όταν αφήνεις το ποντίκι πάνω)
    const fontNames = [
        "Προεπιλογή Σχεδιαστή",
        "Εναλλακτική",
        "Verdana",
        "Tahoma",
        "Century Gothic"
    ];

    // ─── localStorage: Μοναδικό key για κάθε σελίδα ───────────────────────────
    // Παράδειγμα: "fontChoice_/about.html", "fontChoice_/index.html" κ.λπ.
    const storageKey = 'fontChoice_' + window.location.pathname;

    // Φόρτωση αποθηκευμένης επιλογής (αν υπάρχει), αλλιώς ξεκινάμε από 0
    const saved = localStorage.getItem(storageKey);
    let currentFontIndex = (saved !== null && !isNaN(saved)) ? parseInt(saved, 10) : 0;

    // Εφαρμογή της αποθηκευμένης επιλογής αμέσως κατά το φόρτωμα της σελίδας
    function applyFont(index) {
        // Αφαίρεση όλων των πιθανών κλάσεων γραμματοσειράς για καθαρή εκκίνηση
        fontModes.forEach(cls => { if (cls) document.body.classList.remove(cls); });

        const cls = fontModes[index];
        const toggleBtn = document.getElementById('dyslexia-toggle');

        if (cls) {
            document.body.classList.add(cls);
            if (toggleBtn) {
                toggleBtn.classList.add('active');
                toggleBtn.style.backgroundColor = '#4e89ae'; // Μπλε φόντο
                toggleBtn.style.color = '#fff';               // Λευκό εικονίδιο
            }
        } else {
            if (toggleBtn) {
                toggleBtn.classList.remove('active');
                toggleBtn.style.backgroundColor = '';
                toggleBtn.style.color = '';
            }
        }

        if (toggleBtn) {
            toggleBtn.title = `Τρέχουσα Γραμματοσειρά: ${fontNames[index]}\n(Κλικ για αλλαγή)`;
        }
    }

    // Εφαρμογή κατά το φόρτωμα
    applyFont(currentFontIndex);
    // ──────────────────────────────────────────────────────────────────────────

    // Εντοπισμός του κουμπιού
    const toggleBtn = document.getElementById('dyslexia-toggle');

    // Έλεγχος αν το κουμπί υπάρχει στη σελίδα για να αποφύγουμε errors
    if (toggleBtn) {

        // Προσθήκη ακροατή συμβάντος (Event Listener) για το κλικ
        toggleBtn.addEventListener('click', () => {

            // Βήμα 1: Υπολογισμός του επόμενου δείκτη κυκλικά
            // Ο τελεστής % (modulo) μας γυρνάει στο 0 όταν φτάσουμε στο τέλος της λίστας
            currentFontIndex = (currentFontIndex + 1) % fontModes.length;

            // Βήμα 2: Εφαρμογή της νέας γραμματοσειράς
            applyFont(currentFontIndex);

            // Βήμα 3: Αποθήκευση της επιλογής στο localStorage για αυτή τη σελίδα
            localStorage.setItem(storageKey, currentFontIndex);

            // Προαιρετικό: Console log για debugging
            // console.log(`[${storageKey}] Font changed to: ${fontNames[currentFontIndex]}`);
        });
    }
});