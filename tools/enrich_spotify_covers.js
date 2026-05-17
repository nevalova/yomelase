const fs = require('fs');
const path = require('path');

const inputPath = path.resolve(__dirname, '..', 'canciones.js');
const source = fs.readFileSync(inputPath, 'utf8');
const songs = new Function(`${source}\nreturn CANCIONES;`)();

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchCoverUrl(spotifyId) {
    const trackUrl = `https://open.spotify.com/track/${spotifyId}`;
    const url = `https://open.spotify.com/oembed?url=${encodeURIComponent(trackUrl)}`;
    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'User-Agent': 'yomelase-cover-enricher/1.0'
        }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.thumbnail_url || '';
}

function escapeJsString(value) {
    return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function insertCoverUrl(line, coverUrl) {
    const clean = escapeJsString(coverUrl);
    if (!clean) return line;
    if (/coverUrl:\s*"/.test(line)) {
        return line.replace(/coverUrl:\s*"[^"]*"/, `coverUrl: "${clean}"`);
    }
    if (/, aliases:/.test(line)) {
        return line.replace(/, aliases:/, `, coverUrl: "${clean}", aliases:`);
    }
    return line.replace(/ }\s*,?$/, (tail) => `, coverUrl: "${clean}"${tail}`);
}

async function main() {
    const covers = new Map();
    const failures = [];

    for (const song of songs) {
        if (!song.spotifyId) continue;
        try {
            const coverUrl = await fetchCoverUrl(song.spotifyId);
            if (coverUrl) covers.set(song.spotifyId, coverUrl);
            else failures.push(`${song.title} - ${song.artist}: no thumbnail_url`);
        } catch (error) {
            failures.push(`${song.title} - ${song.artist}: ${error.message}`);
        }
        await wait(70);
    }

    const nextSource = source
        .split(/\r?\n/)
        .map((line) => {
            const match = line.match(/spotifyId:\s*"([^"]+)"/);
            if (!match) return line;
            return insertCoverUrl(line, covers.get(match[1]));
        })
        .join('\n');

    fs.writeFileSync(inputPath, nextSource.endsWith('\n') ? nextSource : `${nextSource}\n`, 'utf8');
    console.log(JSON.stringify({
        songs: songs.length,
        covers: covers.size,
        failures
    }, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
