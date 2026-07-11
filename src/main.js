import { Start } from './scenes/Start.js?v=1.2.15';
import { Lobby } from './scenes/Lobby.js?v=1.2.15';
import { Game } from './scenes/Game.js?v=1.2.15';

const config = {
    type: Phaser.AUTO,
    title: 'Whelmen',
    description: 'An elemental dueling game.',
    parent: 'game-container',
    width: 1560,
    height: 720,
    backgroundColor: '#1a1410',
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
        autoCenter: Phaser.Scale.CENTER_BOTH,
        expandParent: true
    },
    dom: {
        createContainer: true
    },
}

const game = new Phaser.Game(config);

// Lock scroll, update CSS custom prop, and force Phaser to recalculate canvas scaling
let resizeTimeout;
const resetViewport = () => {
    window.scrollTo(0, 0);
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    // Debounce Phaser refresh to avoid rapid-fire calls during resize drag
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (game && game.scale) {
            game.scale.refresh();
        }
    }, 100);
};

window.addEventListener('resize', resetViewport);
window.addEventListener('orientationchange', () => {
    // Longer timeout for orientation change — browser viewport dimensions
    // aren't immediately available after the event fires on mobile
    setTimeout(resetViewport, 300);
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
