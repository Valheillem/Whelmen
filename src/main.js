import { Start } from './scenes/Start.js?v=1.0.5';
import { Lobby } from './scenes/Lobby.js?v=1.0.5';
import { Game } from './scenes/Game.js?v=1.0.5';

const config = {
    type: Phaser.AUTO,
    title: 'Whelmen',
    description: 'An elemental dueling game.',
    parent: 'game-container',
    width: 1560,
    height: 720,
    backgroundColor: '#040212',
    pixelArt: false,
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