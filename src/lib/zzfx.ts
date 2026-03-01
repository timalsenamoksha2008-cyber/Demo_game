// ZzFX - Zuper Zmall Zeckless Zound Zynthesizer v3
// Micro audio synthesizer for procedurally generated sound effects.

const zzfx = (...zzfxParams: (number | undefined)[]) => {
    return zzfxP(zzfxG(...zzfxParams));
};

const zzfxR = 44100;
let zzfxX: AudioContext;

// Ensure audio context starts on user interaction
export const initAudio = () => {
    if (!zzfxX) {
        zzfxX = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (zzfxX.state === 'suspended') {
        zzfxX.resume();
    }
};

const zzfxP = (...samples: any[]) => {
    initAudio();
    const buffer = zzfxX.createBuffer(samples.length, samples[0].length, zzfxR),
        source = zzfxX.createBufferSource();

    samples.map((d, i) => buffer.getChannelData(i).set(d));
    source.buffer = buffer;
    source.connect(zzfxX.destination);
    source.start();
    return source;
};

const zzfxG = (volume = 1, randomness = 0.05, frequency = 220, attack = 0, sustain = 0, release = 0.1, shape = 0, shapeCurve = 1, slide = 0, deltaSlide = 0, pitchJump = 0, pitchJumpTime = 0, repeatTime = 0, noise = 0, modulation = 0, bitCrush = 0, delay = 0, sustainVolume = 1, decay = 0, tremolo = 0) => {
    const PI2 = Math.PI * 2,
        sign = (v: number) => (v > 0 ? 1 : -1),
        startSlide = (slide *= (500 * PI2) / zzfxR / zzfxR),
        startFrequency = (frequency *= ((1 + randomness * 2 * Math.random() - randomness) * PI2) / zzfxR),
        b: number[] = [];

    let t = 0,
        fm = 0,
        o = 0,
        c = 0,
        f = startFrequency,
        x = 0;

    attack = attack * zzfxR + 9;
    decay = decay * zzfxR;
    sustain = sustain * zzfxR;
    release = release * zzfxR;
    delay = delay * zzfxR;
    deltaSlide *= (500 * PI2) / zzfxR ** 3;
    let length = (attack + decay + sustain + release + delay) | 0;

    for (
        let j = 0;
        j < length;
        b[j++] = o
    ) {
        if (++c > pitchJumpTime * zzfxR) {
            c = 0;
            f *= 1 + pitchJump / 100;
        }

        fm = repeatTime ? 1 - repeatTime + repeatTime * Math.sin((j * PI2) / (repeatTime * zzfxR)) : 1;

        if (j < attack) {
            o = j / attack;
        } else if (j < attack + decay) {
            o = 1 - ((j - attack) / decay) * (1 - sustainVolume);
        } else if (j < attack + decay + sustain) {
            o = sustainVolume;
        } else if (j < length - delay) {
            o = ((length - j - delay) / release) * sustainVolume;
        } else {
            o = 0;
        }

        o *= volume * fm * (1 - tremolo + tremolo * Math.sin((j * PI2) / (repeatTime * zzfxR)));
        o *=
            sign(x = f * (++t) + modulation * Math.sin(t * frequency * modulation)) *
            Math.abs(Math.sin(x)) ** shapeCurve;

        if (noise) o += (Math.random() * 2 - 1) * noise * o;
        if (bitCrush) o = Math.round(o * bitCrush) / bitCrush;

        f += slide += deltaSlide;
    }
    return [b];
};

// Preset Sounds for Beneath the Ocean
export const playTorpedoShoot = () => zzfx(1.17, 0.05, 274, 0.01, 0.01, 0.06, 1, 1.06, -18, -0.1, 0, 0, 0, 0, 131, 0.01, 0, 0.88, 0, 0.11);
export const playExplosion = () => zzfx(2.2, 0.1, 100, 0.02, 0.1, 0.4, 4, 1.8, -1, -0.1, 0, 0, 0, 1, 0, 0.1, 0, 0.5, 0.2, 0);
export const playMenuClick = () => zzfx(1, 0.05, 500, 0.01, 0, 0.05, 0, 1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0);
export const playKrakenRoar = () => zzfx(2.5, 0.4, 50, 0.2, 0.5, 1.5, 4, 2.5, -0.5, -0.05, 0, 0, 0, 0.8, 50, 0, 0, 1, 0.2, 0.1);
export const playSubDamage = () => zzfx(1.5, 0.1, 150, 0, 0.1, 0.3, 3, 2, -2, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.7, 0.1, 0);
export const playAlert = () => zzfx(1.2, 0, 800, 0.05, 0.1, 0.2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0);
export const playCaveEnter = () => zzfx(2, 0.2, 100, 0.5, 1, 2, 0, 1.5, 0.2, 0.01, 0, 0, 0, 0.1, 10, 0, 0, 0.8, 0.5, 0.2);

// Ambient drone (Low pitched, very long attack/release)
export const playAmbientDrone = () => zzfx(0.4, 0.5, 45, 2, 2, 4, 1, 1, 0, 0, 0, 0, 0, 0.1, 0, 0, 0, 0.5, 0, 0.2);

export default zzfx;
