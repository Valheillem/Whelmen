import { Start } from './scenes/Start.js?v=1.1.19';
import { Lobby } from './scenes/Lobby.js?v=1.1.19';
import { Game } from './scenes/Game.js?v=1.1.19';

const config = {
    type: Phaser.AUTO,
    title: 'Whelmen',
    description: 'An elemental dueling game.',
    parent: 'game-container',
    width: 1560,
    height: 720,
    backgroundColor: '#040212',
    pixelArt: false,
    resolution: window.devicePixelRatio || 1,
    autoRound: true,
    scene: [
        Start,
        Lobby,
        Game
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    dom: {
        createContainer: true
    },
}

new Phaser.Game(config);

// Lock scroll and center viewport on mobile orientation switch or resize
const resetViewport = () => {
    window.scrollTo(0, 0);
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
};

window.addEventListener('resize', resetViewport);
window.addEventListener('orientationchange', () => {
    setTimeout(resetViewport, 150); // Timeout allows the browser's viewport bounds to recalculate fully
});
window.addEventListener('load', resetViewport);
document.addEventListener('DOMContentLoaded', resetViewport);

// Lock browser page vertical/horizontal scrolling and screen bounce on iOS Safari
document.addEventListener('touchmove', (e) => {
    // Allow scrolling ONLY inside elements with the scrollable classes
    if (e.target.closest('.tutorial-content') || e.target.closest('.panel-content') || e.target.closest('.modal-card')) {
        return; 
    }
    // Block native swipe-to-scroll screen shifts on iOS Safari
    if (e.touches.length === 1) {
        e.preventDefault();
    }
}, { passive: false });
