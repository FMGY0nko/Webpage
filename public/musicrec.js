// Global variable of artist names
const artistnames = [];

// Function that gets the API Token for spotify
async function _getToken() {
    
    // Credentials needed to use spotify API
    const clientId = '457f096deb704526ba78634fd084e103';
    const clientSecret = '5443e50046574cb3be3ad0dc2ba2e95c';
    
    // Defines the method and fetches the token from the spotify api link
    const result = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
        },
        body: 'grant_type=client_credentials'
    });

    // Gets the result data
    const data = await result.json();

    // Returns the exact part of the data needed
    return data.access_token;
}

// Function that gets the Id of the inputted artist
async function _getId(token, artist) {
    
    // Defines parameters needed to retrive id of an artist
    const q = ' artist:' + artist;
    const type = 'artist';
    const market = 'US';
    const limit = 1; 
    const offset = 0;

    // Defines the method and fetches the id of an artist 
    const result = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=${type}&market=${market}&limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: { 'Authorization' : 'Bearer ' + token}
    });
    
    // Gets the result data
    const data = await result.json();

    // Returns the id of the id specifically
    return data.artists.items[0].id;
}

// Function that gets the name of an artist
async function _getArtistName(id, token) {
    
    // Defines the method and fethches the artist information
    const result = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
        method: 'GET',
        headers: { 'Authorization' : 'Bearer ' + token}
    });
    
    // Gets the result data
    const data = await result.json();

    // Returns only the name of an artist
    return data.name;
}

// Function that gets the Artists related to the inputed ones
async function _getRelatedArtists(id, token) {
    
    // Defines the method and fetches related artists
    const result = await fetch(`https://api.spotify.com/v1/artists/${id}/related-artists`, {
        method: 'GET',
        headers: { 'Authorization' : 'Bearer ' + token}
    });
    
    // Gets the result data
    const data = await result.json();

    // Returns ids of related artists
    return data.artists.map(artist => artist.id);
}

// Function that converts the ids of the Related Artists to their names
async function _getArtistNames(ids, token) {
    
    // Defines the method and fethches the artists' information
    const result = await fetch(`https://api.spotify.com/v1/artists?ids=${ids.join(',')}`, {
        method: 'GET',
        headers: { 'Authorization' : 'Bearer ' + token}
    });
    
    // Gets the result data
    const data = await result.json();

    // Returns their names 
    return data.artists.map(artist => artist.name);
}

// Function that gets image of an artist
async function _getArtistImage(id, token) {
    
    // Defines the method and fethches the artist information
    const result = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
        method: 'GET',
        headers: { 'Authorization' : 'Bearer ' + token}
    });
    
    // Gets the result data
    const data = await result.json()

    // Returns the image url of their spotify picture 
    return data.images[0].url;
}

// Function that gets the top tracks 
async function _getTopTracks(id, token) {

    // Defines the market
    const market = 'US';

    // Defines the method and fethches the artist's top songs
    const result = await fetch(`https://api.spotify.com/v1/artists/${id}/top-tracks?market=${market}`, {
        method: 'GET',
        headers: { 'Authorization' : 'Bearer ' + token}
    });
    
    // Gets the result data
    const data = await result.json();

    // Returns the tops songs
    return data.tracks.slice(0, 5).map(track => track.name);
}


// Function that connects all the API calls for the related artists
async function APINamesConnecter(input, token, artistId) {
    
    const relatedArtistsIds = await _getRelatedArtists(artistId, token);
    const relatedArtistsNames = await _getArtistNames(relatedArtistsIds, token);
    
    return relatedArtistsNames;
}

// Function that connects all the API calls for the top tracks
async function APITracksConnector(input, token) {

    const artistId = await _getId(token, input);
    const artisttracks = await _getTopTracks(artistId, token);

    return artisttracks;
}

// Shrinks text if it is bigger than the container it is in
function fontscaler(text, container) {
    let fontsize = parseInt(window.getComputedStyle(document.getElementById(text)).fontSize);
    let width = window.innerWidth;
    let finalsize = ((fontsize / width) * 100) - 1;
    let content = document.getElementById(text);
    let con = document.getElementById(container);
    
    
    if (content.clientHeight > con.clientHeight) {
        content.style.fontSize = `${finalsize}vw`;
    }
    
    if (content.scrollWidth > con.clientWidth) {
        content.style.fontSize = `${finalsize}vw`;
    }
}

// Function that creates the final list of artists
async function Results() {
    
    // Gets the name of the artist
    let input = document.getElementById('inputbox').value;
    
    try {
        // Gathers data from the spotify API
        const token = await _getToken(); 
        const artistId = await _getId(token, input);
        const _artistnames = await APINamesConnecter(input, token, artistId);
        const name = await _getArtistName(artistId, token);
        const image = await _getArtistImage(artistId, token);

        // Adds list to a global array
        for (i in _artistnames) {
            artistnames.push(_artistnames[i]);
        };

        // Makes popup visible
        document.getElementById('result').style.display = 'block';
        
        // Adds the name of the artist to the popup and changes the font if it is too big
        document.getElementById('artistname').innerHTML = name;
        fontscaler('artistname', 'con');

        // Adds the image of the artist to the popup
        document.getElementById('artistimage').src = image;
        
        // Adds every artist's name to the popup and changes the font if it is too big
        for (let n = 1; n <= 5; n++) {
            document.getElementById(`artist${n}`).innerHTML = artistnames[n - 1];
            fontscaler(`artist${n}`, `con${n}`);
        };

        // Makes input box empty after search
        document.getElementById('inputbox').value = '';
    } catch(err) { // Displays error box if an error occurs
        document.getElementById('err').style.display = 'block';
    }
}

// Closes a popup window
function closepop(id) {
    document.getElementById(id).style.display = 'none';
}

// Opens the advanced results
async function openadv() {
    // Displays loading screen
    document.getElementById('loadingpop').style.display = 'block';

    // Calls token a defines artistimages and tracks
    const token = await _getToken(); 

    // Defines the array that will be sent to the advanced results page
    const artistimages = [];
    const artisttracks = [];

    // Gets urls of artist images and adds them to artistimages 
    for (let i = 0; i < 5; i++) {
        let artistId = await _getId(token, artistnames[i]);
        artistimages.push(await _getArtistImage(artistId, token));
    };

    // Gets artist's top tracks and adds the to a 2d array
    for (let n = 0; n < 5; n++) {
        artisttracks.push(await APITracksConnector(artistnames[n], token));
    };

    // Adds the lists to the session storage so another javascript file can access them
    sessionStorage.setItem("artistimages", JSON.stringify(artistimages));
    sessionStorage.setItem("artisttracks", JSON.stringify(artisttracks));
    sessionStorage.setItem("artistslist", JSON.stringify(artistnames));

    // Opens the advanced results
    window.location='/advresults';
}