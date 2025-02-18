import { buildWeaponFile, buildAfterFile, buildSourceTokenFile, buildTargetTokenFile } from "./file-builder/build-filepath.js"
import { JB2APATREONDB } from "./databases/jb2a-patreon-database.js";
import { JB2AFREEDB } from "./databases/jb2a-free-database.js";
import { rangedAnimations } from "./rangedAnimation.js";
//import { AAITEMCHECK } from "./item-arrays.js";

const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

export async function meleeAnimation(handler) {
    function moduleIncludes(test) {
        return !!game.modules.get(test);
    }
    let itemName = handler.convertedName;
    switch (handler.convertedName) {
        case "dagger":
        case "handaxe":
        case "spear":
            if (handler.getDistanceTo > 5) {
                rangedAnimations(handler)
                return;                
            } else {
                itemName = "melee" + itemName;
                //console.log(itemName)
            }
            break;
    }
    // Sets JB2A database and Global Delay
    let obj01 = moduleIncludes("jb2a_patreon") === true ? JB2APATREONDB : JB2AFREEDB;
    let globalDelay = game.settings.get("autoanimations", "globaldelay");
    await wait(globalDelay);

    //Builds Primary File Path and Pulls from flags if already set
    let attack = await buildWeaponFile(obj01, itemName, handler)
    let sourceToken = handler.actorToken;
    let sourceScale = itemName === "unarmedstrike" || itemName === "flurryofblows" ? sourceToken.w / canvas.grid.size * 0.85 : sourceToken.w / canvas.grid.size * 0.5;

    //Builds Explosion File Path if Enabled, and pulls from flags if already set
    let explosion;
    if (handler.flags.explosion) {
        explosion = await buildAfterFile(obj01, handler)
    }

    let explosionSound = handler.allSounds?.explosion;
    let explosionVolume = 0.25;
    let explosionDelay = 1;
    let explosionFile = "";
    let playExSound = explosion && handler.explodeSound
    console.log(playExSound)
    if (handler.explodeSound){
        explosionVolume = explosionSound?.volume || 0.25;
        explosionDelay = explosionSound?.delay === 0 ? 1 : explosionSound?.delay;
        explosionFile = explosionSound?.file;
    }
    //console.log(explosion)
    // builds Source Token file if Enabled, and pulls from flags if already set
    let sourceFX;
    let sFXScale;
    if (handler.sourceEnable) {
        sourceFX = await buildSourceTokenFile(obj01, handler.sourceName, handler);
        sFXScale = 2 * sourceToken.w / sourceFX.metadata.width;
    }
    // builds Target Token file if Enabled, and pulls from flags if already set
    let targetFX;
    let tFXScale;
    if (handler.targetEnable) {
        targetFX = await buildTargetTokenFile(obj01, handler.targetName, handler);
    }

    //logging explosion Scale
    let scale = explosion?.scale ?? 1;

    async function cast() {
        let arrayLength = handler.allTargets.length;
        for (var i = 0; i < arrayLength; i++) {

            let target = handler.allTargets[i];
            if (handler.targetEnable) {
                tFXScale = 2 * target.w / targetFX.metadata.width;
            }        

            //Checks Range and sends it to Range Builder if true
            switch (handler.convertedName) {
                case "dagger":
                case "handaxe":
                case "spear":
                    if (handler.getDistanceTo(target) > (5 + handler.reachCheck)) {
                        rangedAnimations(handler)
                        return;
                    }
                    break;
            }
            let hit;
            if (handler.playOnMiss) {
                hit = handler.hitTargetsId.includes(target.id) ? false : true;
            } else {
                hit = false;
            }
new Sequence()
    .effect()
        .atLocation(sourceToken)
        .scale(sFXScale * handler.sourceScale)
        .repeats(handler.sourceLoops, handler.sourceLoopDelay)
        .belowTokens(handler.sourceLevel)
        .waitUntilFinished(handler.sourceDelay)
        .playIf(handler.sourceEnable)
        .addOverride(async (effect, data) => {
            if (handler.sourceEnable) {
                data.file = sourceFX.file;
            }
            //console.log(data)
            return data;
        })
    .effect()
        //.delay(sourceOptions.delayAfter)
        .file(attack.file)
        .atLocation(sourceToken)
        .rotateTowards(target)
        //.JB2A()
        .scale(sourceScale * handler.scale)
        .repeats(handler.animationLoops, handler.loopDelay)
        .randomizeMirrorY()
        .missed(hit)
        .name("animation")
        .belowTokens(handler.animLevel)
        .addOverride(async (effect, data) => {
            data.anchor = {x: 0.4, y: 0.5}
            //console.log(data._distance)
            return data;
        })
        .playIf(() => { return handler.getDistanceTo(target) <= 5})
    .effect()
        .file(attack.file)
        .atLocation(sourceToken)
        .moveTowards(target)
        //.JB2A()
        .scale(sourceScale * handler.scale)
        .repeats(handler.animationLoops, handler.loopDelay)
        .randomizeMirrorY()
        .missed(hit)
        .name("animation")
        .belowTokens(handler.animLevel)    
        .playIf(() => { return handler.getDistanceTo(target) > 5})
    .effect()
        .atLocation("animation")
        //.file(explosion.file)
        .scale({x: scale, y: scale})
        .delay(500 + handler.explosionDelay)
        .repeats(handler.animationLoops, handler.loopDelay)
        .belowTokens(handler.explosionLevel)
        .playIf(() => {return explosion })
        .addOverride(async (effect, data) => {
            if (explosion) {
                data.file = explosion.file;
            }
            //console.log(data)
            return data;
        })
        //.waitUntilFinished(explosionDelay)
    .sound()
        .file(explosionFile)
        .playIf(() => {return explosion && handler.explodeSound})
        .delay(explosionDelay)
        .volume(explosionVolume)
        .repeats(handler.animationLoops, handler.loopDelay)
    .effect()
        .delay(handler.targetDelay)
        .atLocation(target)
        .scale(tFXScale * handler.targetScale)
        .repeats(handler.targetLoops, handler.targetLoopDelay)
        .belowTokens(handler.targetLevel)
        .playIf(handler.targetEnable)
        .addOverride(async (effect, data) => {
            if (handler.targetEnable) {
                data.file = targetFX.file;
            }
            //console.log(data)
            return data;
        })
    .play()
        await wait(750)
        }
    }
    cast()
}
