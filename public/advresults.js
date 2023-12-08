// A font scaler
function fontscaler(text, textsize, container) {
    let content = document.getElementById(text);
    let con = document.getElementById(container);

    if (
        content.clientHeight <= con.clientHeight &&
        content.clientWidth <= con.clientWidth
    ) {
        return textsize;
    } else {
        content.style.fontSize = `${textsize - 0.5}vw`;
        return fontscaler(text, (textsize - 0.5), container);
    };
}

// Function that adds tracks to artist container
function tracks(tracks, n) {
    for (let i = 0; i < artisttracks[n - 1].length; i++) {
        document.getElementById(`${n}tr${i + 1}`).innerHTML = tracks[n - 1][i];
    };
}

function loadresults() {
    // Gets lists from the session storage
    artistslist = JSON.parse(sessionStorage.getItem("artistslist"));
    artistimages = JSON.parse(sessionStorage.getItem("artistimages"));
    artisttracks = JSON.parse(sessionStorage.getItem("artisttracks"));

    // Adds artist names to the webpage
    for (let i = 0; i < artistslist.length; i++) {

        document.getElementById(`art${i + 1}`).innerHTML = artistslist[i];

        // Gets original fontsize 
        let width = window.innerWidth;
        let fontsize = parseInt(window.getComputedStyle(document.getElementById(`art${i + 1}`)).fontSize);

        // Converts it to vw (view width)
        let textsize = (fontsize / width) * 100;

        document.getElementById(`art${i + 1}`).style.fontSize = `${fontscaler(`art${i + 1}`, textsize, `tcon${i + 1}`)}vw`;
    };

    // Adds artist images to the webpage
    for (let n = 1; artistimages.length > 0; n += 1) {
        document.getElementById(`img${n}`).src = artistimages.shift();
    }

    // Adss all the tracks to each artists profile
    for (let j = 1; j <= 5; j++) {
        tracks(artisttracks, j);
    }
}

// Calls function "loadresults()" while the webpage is loading
window.onload = loadresults();