import { createNoise3D, NoiseFunction3D } from "simplex-noise";

export interface ParticlesConfig {
    maxParticles: number;
    lifetime: number;
    startSize: number;
    noiseScale: number;
    noiseStrength: number;
    noiseSpeed: number;
    globalForce: Vector2 | null;
    attractors: Attractor[];
}
export type Vector2 = { x: number; y: number };
export type Attractor = { position: Vector2; strength: number };

export class Particles {
    public particles: Particle[];
    public deadList: number[];
    public config: ParticlesConfig;
    private noise: NoiseField;

    public constructor(config?: Partial<ParticlesConfig>) {
        this.particles = [];
        this.deadList = [];
        this.config = {
            maxParticles: config?.maxParticles || 500,
            lifetime: config?.lifetime || 5,
            startSize: config?.startSize || 10,
            noiseScale: config?.noiseScale || 0.01,
            noiseStrength: config?.noiseStrength || 5,
            noiseSpeed: config?.noiseSpeed || 1,
            globalForce: config?.globalForce || null,
            attractors: config?.attractors || [],
        };
        this.noise = new NoiseField(
            this.config.noiseScale,
            this.config.noiseStrength,
            this.config.noiseSpeed
        );

        for (let i = 0; i < this.config.maxParticles; i++) {
            this.deadList.push(i);
            this.particles.push(new Particle());
        }
    }

    public emit(position: Vector2, velocity: Vector2, color: string) {
        const newIndex = this.deadList.pop();
        if (newIndex === undefined) return;

        this.particles[newIndex].initialize(
            color,
            this.config.startSize,
            position,
            velocity,
            this.config.lifetime,
            () => {
                this.deadList.push(newIndex);
            }
        );
    }

    public update(time: number, deltaTime: number) {
        this.particles.forEach(p => {
            if (p.age < 0) return;
            p.update(time, deltaTime, this.config.globalForce, this.config.attractors, this.noise);
        });
    }

    public draw(ctx: CanvasRenderingContext2D) {
        this.particles.forEach(p => {
            if (p.age < 0) return;
            p.draw(ctx);
        });

        // ctx.fillStyle = "white";
        // for(let i = -1; i <= 1; i += 0.1) {
        //     const x = (i * 0.5 + 0.5) * 500;
        //     const y = this.noise.samples.reduce((acc, s) => acc + ((s >= i && s < (i + 0.1)) ? 1 : 0), 0) * 0.1;
        //     ctx.fillRect(x, 0, 10, y);
        // }

        // ctx.strokeStyle = "white";
        // ctx.fillStyle = "white";
        // for(let x = 0; x < 500; x += 10) {
        //     for(let y = 0; y < 500; y += 10) {
        //         const noiseSample = this.noise.noise3D(x * 0.001, y * 0.001, 0);
        //         const lineX = Math.cos(noiseSample * 3.14159) * 5;
        //         const lineY = Math.sin(noiseSample * 3.14159) * 5;
        //         ctx.fillRect(x - 1, y - 1, 2, 2);
        //         ctx.beginPath();
        //         ctx.moveTo(x, y);
        //         ctx.lineTo(x + lineX, y + lineY);
        //         ctx.stroke();
        //     }
        // }
    }
}

export class Particle {
    public color: string;
    public size: number;
    public position: Vector2;
    public velocity: Vector2;
    public lifetime: number;
    public age: number;
    public onDie?: (particle: Particle) => void;

    public constructor() {
        this.color = "white";
        this.size = 1;
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.lifetime = 1;
        this.age = -1;
    }

    public initialize(
        color: string,
        size: number,
        position: Vector2,
        velocity: Vector2,
        lifetime: number,
        dieCallback: (particle: Particle) => void
    ) {
        this.color = color;
        this.size = size + Math.random() * 2;
        this.position = position;
        this.velocity = velocity;
        this.lifetime = lifetime + (Math.random() - 0.5);
        this.age = 0;
        this.onDie = dieCallback;
    }

    public update(
        time: number,
        deltaTime: number,
        globalForce: Vector2 | null,
        attractors: Attractor[],
        noise: NoiseField
    ) {
        const noiseForce = noise.sample(this.position.x, this.position.y, time);
        this.velocity.x += noiseForce.x * deltaTime;
        this.velocity.y += noiseForce.y * deltaTime;

        if (globalForce) {
            this.velocity.x += globalForce.x * deltaTime;
            this.velocity.y += globalForce.y * deltaTime;
        }

        attractors.forEach(a => {
            const distance = Math.sqrt(
                Math.pow(a.position.x - this.position.x, 2) +
                    Math.pow(a.position.y - this.position.y, 2)
            );
            this.velocity.x +=
                ((a.position.x - this.position.x) / distance) * a.strength * deltaTime;
            this.velocity.y +=
                ((a.position.y - this.position.y) / distance) * a.strength * deltaTime;
        });

        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.age += deltaTime;

        if (this.age > this.lifetime) {
            if (this.onDie) this.onDie(this);
            this.age = -1;
        }
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.globalCompositeOperation = "screen";
        const size = this.size * (1 - this.age / this.lifetime);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x - size * 0.5, this.position.y - size * 0.5, size, size);
    }
}

class NoiseField {
    public scale: number;
    public strength: number;
    public speed: number;
    private noise: NoiseFunction3D;
    //public samples: number[];

    public constructor(scale: number, strength: number, speed: number) {
        //this.samples = [];
        this.scale = scale;
        this.strength = strength;
        this.speed = speed;
        this.noise = createNoise3D();
    }

    public sample(x: number, y: number, time: number): Vector2 {
        const noiseSample = this.noise(x * this.scale, y * this.scale, time * this.speed) * 6;
        //this.samples.push(noiseSample);
        return {
            x: Math.cos(noiseSample * 3.14159) * this.strength,
            y: Math.sin(noiseSample * 3.14159) * this.strength,
        };
    }
}
