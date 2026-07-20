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
        
        let visual;
        let isSprite = projConfig.shape === 'sprite' || projConfig.animKey;

        if (isSprite) {
            let textureKey = projConfig.animKey ? projConfig.animKey.replace('anim_', '') : 'fire_ball';
            visual = this.scene.add.sprite(startX, startY, textureKey);
            visual.play(projConfig.animKey);
            
            // Calculate scale to fit 64x64 baseline based on the texture's original size
            const baseSize = projConfig.size || 64;
            visual.displayWidth = baseSize;
            visual.displayHeight = baseSize;

            // Rotate to face target
            const angle = Phaser.Math.Angle.Between(startX, startY, endX, endY);
            visual.setRotation(angle);
        } else {
            visual = this.scene.add.circle(startX, startY, projConfig.size || 20, projConfig.color);
            visual.setStrokeStyle(4, 0xffffff);
        }

        // Dynamic tail particle flow
        const emitter = this.emitters[element] || this.emitters['air'];
        if (emitter && !isSprite) { // Avoid default tail for rich sprites for now
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
                if (emitter && !isSprite) {
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
        
        if (impact.animKey) {
            let textureKey = impact.animKey.replace('anim_', '');
            let impactSprite = this.scene.add.sprite(x, y, textureKey);
            
            // Base size for impacts can be a bit larger, e.g. 128
            const impactSize = impact.size || 128;
            impactSprite.displayWidth = impactSize;
            impactSprite.displayHeight = impactSize;
            
            impactSprite.play(impact.animKey);
            impactSprite.on('animationcomplete', () => {
                impactSprite.destroy();
            });
        }

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
    
    playSelfCastEffect(spell, x, y, onComplete) {
        const effect = getSpellEffect(spell.name);
        const element = spell.element === 'n/a' ? 'air' : spell.element;
        const color = ELEMENT_COLORS[element] || 0xffffff;

        // Play element-appropriate sound
        if (spell.shield > 0) {
            this.scene.playSound('shield');
        } else {
            this.scene.playSound(element);
        }
        
        // Play the specific sprite impact for this spell, if configured
        if (effect.impact) {
            this.playImpact(spell, effect, x, y);
        }

        // Expanding ring effect
        const ring = this.scene.add.circle(x, y, 10, 0x000000, 0);
        ring.setStrokeStyle(4, color, 1);
        this.scene.tweens.add({
            targets: ring,
            radius: 80,
            alpha: 0,
            duration: 600,
            ease: 'Quad.easeOut',
            onUpdate: () => {
                ring.setStrokeStyle(4, color, ring.alpha);
            },
            onComplete: () => ring.destroy()
        });

        // Second ring with slight delay
        this.scene.time.delayedCall(150, () => {
            const ring2 = this.scene.add.circle(x, y, 10, 0x000000, 0);
            ring2.setStrokeStyle(3, 0xffffff, 0.7);
            this.scene.tweens.add({
                targets: ring2,
                radius: 60,
                alpha: 0,
                duration: 500,
                ease: 'Quad.easeOut',
                onUpdate: () => {
                    ring2.setStrokeStyle(3, 0xffffff, ring2.alpha);
                },
                onComplete: () => ring2.destroy()
            });
        });

        // Radial particle burst
        const LIFESPAN = 600;
        const emitter = this.scene.add.particles(0, 0, 'star', {
            x: x,
            y: y,
            speed: { min: 30, max: 120 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            tint: color,
            alpha: { start: 0.9, end: 0 },
            lifespan: LIFESPAN,
            blendMode: 'ADD'
        });
        emitter.explode(20);

        this.scene.time.delayedCall(LIFESPAN + 100, () => {
            if (emitter && emitter.destroy) emitter.destroy();
        });

        // Brief flash tint on the caster's area
        this.scene.cameras.main.flash(150,
            (color >> 16) & 255,
            (color >> 8) & 255,
            color & 255,
            false,
            null,
            null
        );

        // Callback after visual settles
        this.scene.time.delayedCall(500, () => {
            if (onComplete) onComplete();
        });
    }

    // Stubs for future hooks
    playStatusApply(statusName, target) {}
    playSynergyActivation(synergyType, position) {}
    playShieldGain(amount, position) {}
    playDamageReceived(amount, position) {}
}
