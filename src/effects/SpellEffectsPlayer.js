import { getSpellEffect } from './SpellEffectsRegistry.js';
import { ELEMENT_COLORS } from '../data/ElementConstants.js';

export class SpellEffectsPlayer {
    constructor(scene) {
        this.scene = scene;
        this.emitters = {};
    }

    setupParticles() {
        const elements = ['fire', 'earth', 'water', 'air'];
        elements.forEach(el => {
            this.emitters[el] = this.scene.add.particles(0, 0, 'star', {
                color: ELEMENT_COLORS[el],
                scale: { start: 0.8, end: 0 },
                alpha: { start: 0.8, end: 0 },
                speed: { min: 50, max: 200 },
                lifespan: 800,
                emitting: false
            });
        });
    }

    playSpellCast(spell, startX, startY, endX, endY, onComplete) {
        const effect = getSpellEffect(spell.name);
        
        // 1. Play cast animation
        if (effect.castAnim) {
            // Can add more complex cast animations here
        }
        
        // 2. Play projectile or direct impact
        if (effect.projectile) {
            this.playProjectile(spell, effect, startX, startY, endX, endY, onComplete);
        } else {
            this.playImpact(spell, effect, endX, endY);
            if (onComplete) onComplete();
        }
    }

    playProjectile(spell, effect, startX, startY, endX, endY, onComplete) {
        const projConfig = effect.projectile;
        const element = spell.element === 'n/a' ? 'air' : spell.element;
        
        if (effect.sound) {
            this.scene.playSound(effect.sound.type);
        } else {
            this.scene.playSound(element === 'earth' ? 'shield' : element);
        }
        
        let visual = this.scene.add.circle(startX, startY, projConfig.size || 20, projConfig.color);
        visual.setStrokeStyle(4, 0xffffff);

        // Dynamic tail particle flow
        const emitter = this.emitters[element] || this.emitters['air'];
        if (emitter) {
            emitter.startFollow(visual);
            emitter.start();
        }

        this.scene.tweens.add({
            targets: visual,
            x: endX,
            y: endY,
            duration: 800 * (500 / (projConfig.speed || 500)), 
            ease: 'Quad.easeOut',
            onComplete: () => {
                visual.destroy();
                if (emitter) {
                    emitter.stop();
                    emitter.explode(25, endX, endY);
                }
                
                this.playImpact(spell, effect, endX, endY);
                if (onComplete) onComplete();
            }
        });
    }

    playImpact(spell, effect, x, y) {
        this.scene.playSound('hit');
        const impact = effect.impact;
        
        if (impact.screenShake) {
            this.scene.cameras.main.shake(impact.screenShake.duration, impact.screenShake.intensity * 0.01);
        }
        
        if (impact.flash) {
            this.scene.cameras.main.flash(200, 
                (impact.flash >> 16) & 255, 
                (impact.flash >> 8) & 255, 
                impact.flash & 255
            );
        }
    }

    playElementalBurst(x, y, element) {
        const safeElement = element === 'n/a' ? 'air' : element;
        
        if (safeElement === 'fire') this.scene.playSound('fire');
        else if (safeElement === 'water') this.scene.playSound('water');
        else if (safeElement === 'earth') this.scene.playSound('earth');
        else if (safeElement === 'air') this.scene.playSound('air');

        const color = ELEMENT_COLORS[element] || 0xffffff;
        const LIFESPAN = 600;

        const emitter = this.scene.add.particles(0, 0, 'star', {
            x: x,
            y: y,
            speed: { min: 50, max: 200 },
            angle: { min: 180, max: 360 }, // Burst upwards
            scale: { start: 0.6, end: 0 },
            tint: color,
            alpha: { start: 1, end: 0 },
            lifespan: LIFESPAN,
            gravityY: 400, // Particles fall down
            blendMode: 'ADD'
        });
        emitter.explode(15);

        // C11 fix: destroy the one-shot emitter after all particles have expired
        this.scene.time.delayedCall(LIFESPAN + 100, () => {
            if (emitter && emitter.destroy) emitter.destroy();
        });
    }
    
    // Stubs for future hooks
    playStatusApply(statusName, target) {}
    playSynergyActivation(synergyType, position) {}
    playShieldGain(amount, position) {}
    playDamageReceived(amount, position) {}
}
