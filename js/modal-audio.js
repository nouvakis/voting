/* --- modal-audio.js --- 
   Η ΕΝΙΑΙΑ Βιβλιοθήκη για:
   1. Ήχους
   2. Text-to-Speech
   3. SweetAlert2 (Alerts & Infos με Auto-Close)
   4. Info Modals (Θεωρία)
   
   <span class='lang-el' aria-label='ήμεϊλ'>Email</span>
   <span class='no-read lang-el' >...</span>
*/

let fa_pause = '<svg class="icon-svg" viewBox="0 0 320 512" data-icon-name="fa-pause"><path fill="currentColor" d="M48 64C21.5 64 0 85.5 0 112V400c0 26.5 21.5 48 48 48H80c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H48zm192 0c-26.5 0-48 21.5-48 48V400c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H240z"/></svg>';
let fa_play = '<svg class="icon-svg" viewBox="0 0 384 512" data-icon-name="fa-play"><path fill="currentColor" d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg>';
let fa_stop='<svg class="icon-svg" viewBox="0 0 384 512" data-icon-name="fa-stop"><path fill="currentColor" d="M0 128C0 92.7 28.7 64 64 64H320c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128z"/></svg>';
let fa_redo='<svg class="icon-svg" viewBox="0 0 512 512" data-icon-name="fa-redo"><path fill="currentColor" d="M463.5 224H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5z"/></svg>';
let fa_windows = '<svg class="icon-svg" viewBox="0 0 448 512" data-icon-name="fa-windows"><path fill="currentColor" d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 480V268.4H203.8v177.9zm0-380.6v180.1H448V32L203.8 65.7z"/></svg>';

// --- 1. ΗΧΟΙ ---
let audioCtx;
function initAudio() { if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } if (audioCtx.state === 'suspended') { audioCtx.resume(); } }
function playTone(freq, startTime, duration) { const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination); osc.frequency.value = freq; gain.gain.setValueAtTime(0.1, startTime); gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration); osc.start(startTime); osc.stop(startTime + duration); }

window.playSound = function(type) {
    initAudio(); const now = audioCtx.currentTime;
    
    if (type === 'click') { 
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination); osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1); 
    } 
    else if (type === 'success') { 
        playTone(523.25, now, 0.1); playTone(659.25, now + 0.1, 0.1); playTone(783.99, now + 0.2, 0.2); 
    } 
    else if (type === 'error') { 
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.linearRampToValueAtTime(100, now + 0.3); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.3); osc.start(now); osc.stop(now + 0.3); 
    }
    else if (type === 'info') {
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination); osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.3); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.3); osc.start(now); osc.stop(now + 0.3);
    }
};

// --- 2. TEXT-TO-SPEECH ---
let synth = window.speechSynthesis; let voices = [];
if (speechSynthesis.onvoiceschanged !== undefined) { speechSynthesis.onvoiceschanged = () => voices = synth.getVoices(); }
voices = synth.getVoices();

function updatePlayIcon(s) { 
    // Βρίσκουμε το κουμπί
    const b = document.getElementById('btnPause'); 
    
    // Αν δεν υπάρχει το κουμπί (π.χ. δεν έχει ανοίξει το modal), σταματάμε
    if (!b) return; 
    
    // Αλλαγή περιεχομένου και τίτλου ανάλογα με την κατάσταση
    if (s === 'playing') { 
        b.innerHTML = fa_pause; // Βάζουμε το SVG της παύσης
        b.title = "Παύση"; 
    } else { 
        b.innerHTML = fa_play;  // Βάζουμε το SVG της αναπαραγωγής
        b.title = "Συνέχιση"; 
    } 
}

function speakMixedText(htmlContent) {
    if (synth.speaking) synth.cancel();
    if (document.body.classList.contains('no-speech')) return;

    // Regex για καθαρισμό Emoji
    const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;

    const div = document.createElement('div');
    div.innerHTML = htmlContent;

    const grVoice = voices.find(v => v.lang.includes('el')) || null;
    const enVoice = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US')) || null;

    let rawQueue = [];

    // --- ΒΗΜΑ 1: Διάβασμα του HTML Δέντρου ---
    function traverse(node) {
        // Περίπτωση: TEXT NODE (Απλό κείμενο)
        if (node.nodeType === 3) {
            let text = node.textContent.replace(emojiRegex, '').trim();
            if (!text) return;

            // Χωρισμός Αγγλικών / Ελληνικών
			const chunks = text.split(/\b([A-Za-z](?:[A-Za-z0-9\s\-\.\,\(\)])*[A-Za-z0-9])\b/g);
            
            chunks.forEach(c => {
                if (!c.trim()) return;
                // Έλεγχος γλώσσας
                if (/[α-ωΑ-Ω\u0370-\u03FF]/.test(c)) {
                    rawQueue.push({ text: c, lang: 'el', voice: grVoice });
                } else if (/[A-Za-z]/.test(c)) {
                    rawQueue.push({ text: c, lang: 'en', voice: enVoice });
                } else {
                    // Σημεία στίξης -> πάνε στην Ελληνική (default)
                    rawQueue.push({ text: c, lang: 'el', voice: grVoice });
                }
            });
        }
        // Περίπτωση: ELEMENT NODE (Tags)
        else if (node.nodeType === 1) {
            if (node.classList.contains('no-read')) return;

            // Έλεγχος για aria-label ή περιεχόμενο
            let label = node.getAttribute('aria-label');
            let content = label ? label : node.textContent;
            let textToSpeak = content.replace(emojiRegex, '').trim();

            if (node.classList.contains('lang-en')) {
                if(textToSpeak) rawQueue.push({ text: textToSpeak, lang: 'en', voice: enVoice });
                return; // Δεν μπαίνουμε στα παιδιά
            }
            else if (node.classList.contains('lang-el')) {
                if(textToSpeak) rawQueue.push({ text: textToSpeak, lang: 'el', voice: grVoice });
                return; // Δεν μπαίνουμε στα παιδιά
            }
            
            // Συνέχεια στα παιδιά αν δεν υπάρχει ειδική κλάση
            node.childNodes.forEach(child => traverse(child));
        }
    }

    traverse(div);

    // --- ΒΗΜΑ 2: ΣΥΓΧΩΝΕΥΣΗ (MERGING) ---
    // Ενώνει συνεχόμενα κομμάτια της ίδιας γλώσσας για να μην "κομπιάζει" η φωνή
    let mergedQueue = [];
    if (rawQueue.length > 0) {
        let current = rawQueue[0];
        
        for (let i = 1; i < rawQueue.length; i++) {
            let nextItem = rawQueue[i];
            
            // Αν έχουν ίδια γλώσσα, ένωσέ τα
            if (current.lang === nextItem.lang) {
                // Προσθέτουμε κενό αν δεν υπάρχει σημείο στίξης
                let separator = (/[.,?!]$/.test(current.text) || /^[.,?!]/.test(nextItem.text)) ? " " : " ";
                current.text += separator + nextItem.text;
            } else {
                mergedQueue.push(current);
                current = nextItem;
            }
        }
        mergedQueue.push(current);
    }

    // --- ΒΗΜΑ 3: ΕΚΤΕΛΕΣΗ ---
    mergedQueue.forEach((item, index) => {
        const u = new SpeechSynthesisUtterance(item.text);
        u.rate = 1.0; // Σταθερή ταχύτητα
        u.lang = item.lang === 'el' ? 'el-GR' : 'en-US';
        if (item.voice) u.voice = item.voice;

        if (index === mergedQueue.length - 1) {
            u.onend = function() { updatePlayIcon('stopped'); };
        }
        synth.speak(u);
    });

    updatePlayIcon('playing');
}

window.playAudio = function() {
    const t = document.getElementById('modalTitle'); 
	const b = document.getElementById('modalText');
    if (!t || !b) return;
    speakMixedText(t.innerHTML + ". " + b.innerHTML);
}
window.toggleSpeech = function() {
	if (synth.speaking && !synth.paused) {
		synth.pause(); updatePlayIcon('paused');
	}
	else if (synth.paused) {
		synth.resume(); updatePlayIcon('playing');
	}
	else {
		playAudio(); 
	}
};
window.stopSpeech = function() { 
	synth.cancel(); 
	updatePlayIcon('stopped'); 
};
window.replaySpeech = function() { stopSpeech(); setTimeout(playAudio, 100); };

// --- 3. SWEETALERT (ALERTS & INFO) ---

// Α. Κλασικό Alert (Warning)
window.showAlert = function(msg) { 
    playSound('error'); 
    Swal.fire({ 
        icon: 'warning', 
        title: 'Προσοχή!', 
        html: msg, 
        confirmButtonText: 'Εντάξει', 
        confirmButtonColor: '#1e88e5', 
        background: '#fff'
    }); 
};

// Β. ΝΕΟ: Info Alert (με προαιρετικό Auto-Close)
// closeAfterMs: χρόνος σε milliseconds (π.χ. 3000). Αν είναι 0 ή δεν δοθεί, δεν κλείνει μόνο του.
window.showInfo = function(msg, withSound = true, closeAfterMs = 0) {
    if (withSound) playSound('info'); 
    
    // Ρυθμίσεις του SweetAlert
    let swalConfig = {
        icon: 'info',
        title: 'Πληροφορία',
        html: msg,
        confirmButtonText: 'Κατάλαβα',
        confirmButtonColor: '#17a2b8',
        background: '#fff'
    };

    // Αν έχει δοθεί χρόνος κλεισίματος
    if (closeAfterMs > 0) {
        swalConfig.timer = closeAfterMs;
        swalConfig.timerProgressBar = false; // ΔΕΝ δείχνει μπάρα χρόνου
    }

    Swal.fire(swalConfig);
};

window.showConfirm = function(msg, callback) { 
    playSound('click'); 
    Swal.fire({ 
        title: 'Είσαι σίγουρος;', 
        html: msg.replace(/\n/g, '<br>'), 
        icon: 'question', 
        showCancelButton: true, 
        confirmButtonColor: '#28a745', 
        cancelButtonColor: '#dc3545', 
        confirmButtonText: 'Ναι', 
        cancelButtonText: 'Όχι' 
    }).then((res) => { if (callback) callback(res.isConfirmed); }); 
};

function ensureModalExists() {
    if (document.getElementById('infoModal')) return; // Αν υπάρχει ήδη, σταματάμε

    const h = `
        <div id="infoModal" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="modalTitle"></h2>
                        <div class="window-controls">
                            <div class="modal-audio-controls" style="display: inline-flex; align-items: center; gap: 5px;">
                                <button id="btnPause" class="control-btn" onclick="toggleSpeech()" title="Παύση">${fa_play}</button>
                                <button id="btnReplay" class="control-btn" onclick="replaySpeech()" title="Επανάληψη">${fa_redo}</button>
                                <button id="btnStop" class="control-btn" onclick="stopSpeech()" title="Στοπ">${fa_stop}</button>
                            </div>
                            <div style="width:1px; height:20px; background:#ddd; margin:0 5px; display:inline-block; vertical-align:middle;"></div>
                            <button class="control-btn close-btn" onclick="closeModal()" title="Κλείσιμο">&times;</button>
                        </div>
                    </div>
                    <div id="modalText" class="modal-body"></div>
                </div>
            </div>
    `;
    document.body.insertAdjacentHTML('beforeend', h);
    document.getElementById('infoModal').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
}

function updateSpeechHead(speechBtn) {
	 if (!speechBtn) return;
	// 1. Το SVG για όταν ΜΙΛΑΕΙ (Το δικό σου)
	const iconOn = `
		<svg viewBox="-2 0 38 38" class="speech-icon">
			<path fill="#FA743E" d="M35.838 23.159c.003.553-.443 1.002-.998 1.003l-5 .013c-.552.002-.999-.446-1-.997-.003-.555.444-1.002.995-1.004l5-.013c.553 0 1.002.445 1.003.998zm-1.587-5.489c.238.499.025 1.095-.475 1.333l-4.517 2.145c-.498.236-1.094.023-1.33-.476-.239-.498-.025-1.094.474-1.333l4.516-2.144c.5-.236 1.095-.024 1.332.475zm.027 10.987c.234-.501.02-1.096-.48-1.33l-4.527-2.122c-.501-.235-1.095-.02-1.33.48-.234.501-.019 1.096.482 1.33l4.526 2.123c.499.234 1.096.019 1.329-.481z"/><path fill="#269" d="M27.979 14.875c-1.42-.419-2.693-1.547-3.136-2.25-.76-1.208.157-1.521-.153-4.889C24.405 4.653 20.16 1.337 15 1c-2.346-.153-4.786.326-7.286 1.693-6.42 3.511-8.964 10.932-4.006 18.099 4.47 6.46.276 9.379.276 9.379s.166 1.36 2.914 3.188c2.749 1.827 6.121.588 6.121.588s1.112-3.954 4.748-3.59c2.606.384 6.266-.129 7.191-1.024.865-.837-.151-1.886.539-4.224-2.365-.232-3.665-1.359-3.79-2.948 2.625.255 3.708-.578 4.458-1.495-.021-.54-.075-1.686-.127-2.454 2.322-.672 3.212-2.962 1.941-3.337z"/>
		</svg>`;

	// 2. Το SVG για όταν είναι MUTE (Χωρίς τα πορτοκαλί κύματα, με κόκκινη γραμμή)
	const iconOff = `
		<svg viewBox="-2 0 38 38" class="speech-icon">
			 <path fill="#000000" d="M35.838 23.159c.003.553-.443 1.002-.998 1.003l-5 .013c-.552.002-.999-.446-1-.997-.003-.555.444-1.002.995-1.004l5-.013c.553 0 1.002.445 1.003.998zm-1.587-5.489c.238.499.025 1.095-.475 1.333l-4.517 2.145c-.498.236-1.094.023-1.33-.476-.239-.498-.025-1.094.474-1.333l4.516-2.144c.5-.236 1.095-.024 1.332.475zm.027 10.987c.234-.501.02-1.096-.48-1.33l-4.527-2.122c-.501-.235-1.095-.02-1.33.48-.234.501-.019 1.096.482 1.33l4.526 2.123c.499.234 1.096.019 1.329-.481z" id="path1" style="opacity:0.43822394" /><path fill="black" d="M 27.979,14.875 C 26.559,14.456 25.286,13.328 24.843,12.625 24.083,11.417 25,11.104 24.69,7.736 24.405,4.653 20.16,1.337 15,1 12.654,0.847 10.214,1.326 7.714,2.693 1.294,6.204 -1.25,13.625 3.708,20.792 c 4.47,6.46 0.276,9.379 0.276,9.379 0,0 0.166,1.36 2.914,3.188 2.749,1.827 6.121,0.588 6.121,0.588 0,0 1.112,-3.954 4.748,-3.59 2.606,0.384 6.266,-0.129 7.191,-1.024 0.865,-0.837 -0.345815,-2.989952 0.344185,-5.327952 C 24.47258,22.179987 24.853382,23.000901 21.707,22.161 c 3.17602,0.53051 3.563493,0.912403 3.590166,-0.231009 C 25.276166,21.389991 26.09,18.98 26.038,18.212 28.36,17.54 29.25,15.25 27.979,14.875 Z" id="path2" /><path id="line2" style="stroke:red;stroke-width:3;stroke-linecap:round" d="M 37.870842,37.67275 -2.558266,-2.5642195" />
		</svg>`;
	// Έλεγχος ποιο εικονίδιο να δείξουμε
	if (document.body.classList.contains('no-speech')) {
		speechBtn.innerHTML = iconOff; // Βάζουμε το Mute SVG
		if (typeof stopSpeech === 'function') stopSpeech();
	} else {
		speechBtn.innerHTML = iconOn; // Βάζουμε το κανονικό SVG
	}
}
document.addEventListener('DOMContentLoaded', () => {	
	// Κώδικας για το κουμπί Ομιλίας
    const speechBtn = document.getElementById('speech-toggle');
    if (speechBtn) {
		// ΕΔΩ: Ελέγχει αν το body ΔΕΝ έχει no-speech
        /*if (!document.body.classList.contains('no-speech')) {
            speechBtn.classList.add('active');  // <-- Προσθέτει active
        }*/
		updateSpeechHead(speechBtn);
        
        speechBtn.addEventListener('click', () => {
            document.body.classList.toggle('no-speech');
            speechBtn.classList.toggle('active');
            
            updateSpeechHead(speechBtn);
        });
    }
});

// Προσθήκη: Κλείσιμο των Modals με το πλήκτρο Escape (ESC)
document.addEventListener('keydown', function(event) {
    // Ελέγχουμε αν το πλήκτρο που πατήθηκε είναι το Escape
    if (event.key === 'Escape' || event.key === 'Esc') {
        
        // 1. Κλείσιμο των Info Modals (τα θεωρητικά πλαίσια του βιβλίου σου)
        if (typeof closeModal === 'function') {
            closeModal();
        }
        
        // 2. Κλείσιμο των Game Modals (για τις διαδραστικές εφαρμογές που φτιάξαμε)
        if (typeof closeGameModal === 'function') {
            closeGameModal(false);
        }

        // 3. Σταμάτημα της φωνητικής αφήγησης (προαιρετικό αλλά πολύ βολικό)
        if (typeof stopSpeech === 'function') {
            stopSpeech();
        }
    }
});

window.showModal = function(event, key) {
    if (event && (event.target.tagName === 'A' || event.target.closest('a'))) return;
    
    playSound('click');
	
    ensureModalExists();

    if (typeof window.modalData === 'undefined' || !window.modalData[key]) {
        console.warn("Missing data for: " + key); return;
    }
    const data = window.modalData[key];

    document.getElementById('modalTitle').innerHTML = data.title;
    let content = data.text;
    if (data.img) content += `<img src="${data.img}" style="width:100%; margin-top:15px; border-radius:10px;">`;
    document.getElementById('modalText').innerHTML = content;
    
    document.getElementById('infoModal').classList.add('show');
	
	if (!document.body.classList.contains('no-speech')) {
        playAudio();
    }
};

window.closeModal = function() {
    const m = document.getElementById('infoModal'); if (m) m.classList.remove('show');
    stopSpeech();
};

function openSplitScreenGuide() {
    // 1. Παίζουμε ήχο
    if(typeof playSound === 'function') playSound('info');

    // 2. Εμφανίζουμε τις οδηγίες με SweetAlert
    Swal.fire({
        title: '✂️ Πώς να χωρίσεις την οθόνη',
        html: `
            <div style="text-align: left; font-size: 1.1em; line-height: 1.6;">
                <p>1. Θα ανοίξει το Google σε νέι παράθυρο.</p>
                <p>2. Χρησιμοποίησε το πληκτρολόγιο:</p>
                <ul style="background: #f1f1f1; padding: 5px 25px; border-radius: 8px;">
                    <li>Πάτα το πλήκτρο <strong>Windows ${fa_windows}</strong> + <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAYAAABWk2cPAAAAAXNSR0IB2cksfwAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+kLHhIaDJywMLkAAAQ3SURBVEjHpZY9a1RPFMZ/Z2b2DTQaQbtYW4iNlWBnoa2Idhb5BmnUr2Ag+B1iY5PSSrCIYGsjCClWUEwgSxI3ye7evW9z/oV37n+82V0NXhju3Dsv5zzPnPOcEarn7du3OhgMEBGKosB7z78+1lparVa91+rqqgAIwOvXr/XOnTtcvXqVoijIsow8z//ZaLvdptPpAPD9+3fevXvH8+fPRba2tvTWrVusrKxgjKEsS7Isw3uPtRYA5xwA3vv6vzEGVcV7j4ggIgAURYGqUpYlxhiccxweHjIYDNjb2+PTp0+44XDI5cuXyfMcay3WWrrdLru7u3jvUVWMMfVYs4UxEcEYQ7fbxRiDiJCmKTs7O+zv7zOZTBiNRhweHuKyLCPLMgCMMRhjSJKE0WiEc65GGZ6A6E+PiOCcY2dnh9FohPee6XTKeDzGBTrDRGvtwvMUEQ10RrTKPMMhPrz3FEVBURQ4VUVV/9Z79d6LiDTPU2cZDnvHDcDN2lxVZ9IYodNwhvNQzjOqqphFC+J3s++9F1VdeMDnMhqjDP04LQA2Nzf1w4cPukhE5tFrFqGctUHVlyRJZHNzU169esXu7u65kLpFSIui4MePHzjnaLVaWGvFOafWWqbTKSJCv99nfX1dHjx4wP379+l2u7/tFXL9j0YDop8/f7K2tkar1aLT6eCco91uS7vdrv8F9Xn//j1fvnzh0aNH3Lhx4+/pFRGtBjUyrsYYvPfqvVcR0UpEtBrTsO709FT39/e1SiEAjdtCpFX+6aVLl+TZs2eICO12G+ecOOew1rK9vc3Xr1+lLEtUVW/evMmTJ09YXl6WykjIZQmaPddoGBARer2e3r17txbuoLPOOT5//sy3b9+4du0ajx8/5vbt20GDVVVrAQkOhACcKw6VZ6JRGMepE4rAvXv3ePjwIUtLS7HTUlEvDZS6EGmQt8qzmqrq/ADk6dOnXLx4UStVWpCqeiaoTGOGBLVp/gNEVSVQ1+v16u8wp/mukNZtrjgEpHFkGmPOeNzQY21mwSKhMYvoDfoaKsusIrCoQoWzD2tDvy5tQUOrFDhTPytaNV4c19IwFn8Ph0PSNJUzpa0oCtI0pSxLvPekacpkMqHX64WbnFhrY7GQKhJlRjpoiP6joyP5+PGjTiaTUALrXHV5npOmKXmek2UZo9GIg4MDyrKk0+lok4lAfVmWdfpUCDWm8eDggMFgUF/mwhrv/S+jSZIAkCQJx8fHnJycUBSFzBBrmfdulDipnJI4TmqjAOPxGO89SZJwenpaXyPP0+KgihHHjnvvf132lpeX6ff7XLlyhel0ynQ6rSc2NfNvWojw2JlwKRsOh6ysrPyKtBcvXujS0hIXLlz4zav4fV6jwVhZluR5ztHREePxmDdv3vw/Y2NjQ/v9fn39bAZQk8ZZ37FGxyittVy/fp2XL18KwH+XIlXYXbi8YgAAAABJRU5ErkJggg==" alt="Πλήκτρο Δεξί Βέλος" style="width: 29px; height: 29px; vertical-align: middle; margin-left: 8px; border-radius: 4px;"></li>
                    <li>Μετά διάλεξε αυτό το παράθυρο για Αριστερά.</li>
                </ul>
            </div>
        `,
        icon: 'info',
        confirmButtonText: '🚀 Πάμε!',
        confirmButtonColor: '#2e7d32',
        showCancelButton: true,
        cancelButtonText: 'Άκυρο'
    }).then((result) => {
        if (result.isConfirmed) {
            // 3. Ανοίγουμε το Google σε νέο παράθυρο (προσπαθούμε να δώσουμε διαστάσεις)
            // Σημείωση: Οι διαστάσεις λειτουργούν μόνο αν ανοίξει ως popup
            const width = window.screen.width / 2;
            const height = window.screen.height;
            
            // Ανοίγει το Google
            window.open('https://www.google.gr', '_blank', `width=${width},height=${height},left=${width},top=0`);
        }
    });
}
