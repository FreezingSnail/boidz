const maxspeed: number = 6;
const minspeed: number = 3;

class Velocity {
  vx: number;
  vy: number;
  vz: number;

  constructor(x: number, y: number, z: number) {
    this.vx = x / 10;
    this.vy = y / 10;
    this.vz = z / 10;
  }

  speed(): number {
    return Math.sqrt((this.vx * this.vx) + (this.vy * this.vy) + (this.vz * this.vz))
  }

  throttle(speed: number) {
    this.vx = (this.vx / speed) * maxspeed
    this.vy = (this.vy / speed) * maxspeed
    this.vz = (this.vz / speed) * maxspeed
  }

  speedup(speed: number) {
    this.vx = (this.vx / speed) * minspeed
    this.vy = (this.vy / speed) * minspeed
    this.vz = (this.vz / speed) * minspeed
  }
}

function calculateDistance(boid1: Boid, boid2: Boid): number {
  const dx = boid2.x - boid1.x;
  const dy = boid2.y - boid1.y;
  const dz = boid2.z - boid1.z;

  // Euclidean distance formula
  return Math.sqrt((dx * dx) + (dy * dy) + (dz * dz));
}


const margin = 400;
const turn_factor = 0.2;
const avoid_factor: number = 0.3;
const visible_range: number = 15;
const avoid_range: number = 10;
const matchingfactor: number = 0.008;
const centeringfactor: number = 0.00005;
const maxbias: number = 0.01;
const bias_increment: number = 0.00004;
const biasval: number = 0.001;
const targetWeight = 0.08; // Weight for targeting behavior


export class Boid {
  id: number;
  x: number;
  y: number;
  z: number;
  velocity: Velocity;

  targetX: number;
  targetY: number;
  targetZ: number;



  constructor(id: number) {
    this.id = id;
    this.x = Math.random() * margin - (margin / 2);
    this.y = Math.random() * margin - (margin / 2);
    this.z = Math.random() * margin - (margin / 2);

    this.velocity = new Velocity(
      (Math.random() * 12) - 6,
      (Math.random() * 12) - 6,
      (Math.random() * 12) - 6);

    this.targetX = 0; // Initialize target position
    this.targetY = 0;
    this.targetZ = 0;
  }



  boid_algo(boids: Boid[]) {
    //seperation
    let close_dx = 0;
    let close_dy = 0;
    let close_dz = 0;
    //alignment
    let xvel_avg = 0;
    let yvel_avg = 0;
    let zvel_avg = 0;
    //cohesion
    let xpos_avg = 0;
    let ypos_avg = 0;
    let zpos_avg = 0;
    let neigboring_boids = 0;

    boids.forEach((boid) => {
      if (this == boid) {
      } else {
        let dist = calculateDistance(this, boid);
        if (dist < avoid_range) {
          // seperation
          close_dx += this.x - boid.x;
          close_dy += this.y - boid.y;
          close_dz += this.z - boid.z;
        }

        else if (dist < visible_range) {
          neigboring_boids += 1;

          // alignment
          xvel_avg += boid.velocity.vx;
          yvel_avg += boid.velocity.vy;
          zvel_avg += boid.velocity.vz;

          // cohesion
          xpos_avg += boid.x;
          ypos_avg += boid.y;
          zpos_avg += boid.z;
        }
      }
    })


    if (neigboring_boids > 0) {
      // alignment
      xvel_avg += xvel_avg / neigboring_boids;
      yvel_avg += yvel_avg / neigboring_boids;
      zvel_avg += zvel_avg / neigboring_boids;

      // cohesion
      xpos_avg += xpos_avg / neigboring_boids;
      ypos_avg += ypos_avg / neigboring_boids;
      zpos_avg += zpos_avg / neigboring_boids;
      // alignment
      this.velocity.vx += (xvel_avg - this.velocity.vx) * matchingfactor;
      this.velocity.vy += (yvel_avg - this.velocity.vy) * matchingfactor;
      this.velocity.vz += (zvel_avg - this.velocity.vz) * matchingfactor;

      // cohesion
      this.velocity.vx += (xpos_avg - this.x) * centeringfactor
      this.velocity.vy += (ypos_avg - this.y) * centeringfactor
      this.velocity.vz += (zpos_avg - this.z) * centeringfactor
    }


    // seperation
    this.velocity.vx += avoid_factor * close_dx;
    this.velocity.vy += avoid_factor * close_dy;
    this.velocity.vz += avoid_factor * close_dz;




    this.add_random_nudge();
    this.bias_tick();
    this.update_velocity();
    this.bias_to_target();
    this.avoid_edge_spehere();
    this.update_pos();
  }


  avoid_edge() {
    const edge_threshold = margin * 0.8;  // Threshold where edge avoidance starts
    const aggressive_turnfactor = 0.5;    // More aggressive turn factor when near the edge

    // X-axis edge handling
    if (this.x < (margin * -1)) {
      const dist = Math.abs(this.x + margin);
      this.velocity.vx += aggressive_turnfactor * (dist / edge_threshold);
    } else if (this.x > margin) {
      const dist = Math.abs(this.x - margin);
      this.velocity.vx -= aggressive_turnfactor * (dist / edge_threshold);
    }

    // Y-axis edge handling
    if (this.y < (margin * -1)) {
      const dist = Math.abs(this.y + margin);
      this.velocity.vy += aggressive_turnfactor * (dist / edge_threshold);
    } else if (this.y > margin) {
      const dist = Math.abs(this.y - margin);
      this.velocity.vy -= aggressive_turnfactor * (dist / edge_threshold);
    }

    // Z-axis edge handling (if using 3D space)
    if (this.z < (margin * -1)) {
      const dist = Math.abs(this.z + margin);
      this.velocity.vz += aggressive_turnfactor * (dist / edge_threshold);
    } else if (this.z > margin) {
      const dist = Math.abs(this.z - margin);
      this.velocity.vz -= aggressive_turnfactor * (dist / edge_threshold);
    }
  }

  avoid_edge_spehere() {

    // Calculate the distance from the origin
    const distanceFromOrigin = Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);

    // Check if the boid is outside the sphere
    if (distanceFromOrigin > margin) {
      // Calculate a normalized direction vector away from the origin
      const normX = -this.x / distanceFromOrigin;
      const normY = -this.y / distanceFromOrigin;
      const normZ = -this.z / distanceFromOrigin;

      // Turn away from the origin by modifying the velocity
      this.velocity.vx += normX * turn_factor; // Push velocity in the x direction
      this.velocity.vy += normY * turn_factor; // Push velocity in the y direction
      this.velocity.vz += normZ * turn_factor; // Push velocity in the z direction
    }
  }


  update_velocity() {
    let spd = this.velocity.speed()
    if (spd > maxspeed) {
      this.velocity.throttle(spd)
    }
    if (spd < minspeed) {
      this.velocity.speedup(spd)
    }
    spd = this.velocity.speed()
  }

  update_pos() {

    const throttle_update = 5;
    this.x += this.velocity.vx / throttle_update;
    this.y += this.velocity.vy / throttle_update;
    this.z += this.velocity.vz / throttle_update;
  }

  bias_tick() {
    if (this.id % 2 === 0)
      this.velocity.vx = (1 - biasval) * this.velocity.vx + (biasval * 1)
    else
      this.velocity.vx = (1 - biasval) * this.velocity.vx + (biasval * (-1))
  }

  add_random_nudge() {
    const randomFactor = 0.05; // A small nudge to help escape oscillation
    this.velocity.vx += (Math.random() - 0.5) * randomFactor;
    this.velocity.vy += (Math.random() - 0.5) * randomFactor;
    this.velocity.vz += (Math.random() - 0.5) * randomFactor; // For 3D space
  }

  setTarget(targetX: number, targetY: number, targetZ: number) {
    this.targetX = targetX;
    this.targetY = targetY;
    this.targetZ = targetZ;
  }

  bias_to_target() {
    // Targeting behavior: steer towards the target
    const target_dx = this.targetX - this.x;
    const target_dy = this.targetY - this.y;
    const target_dz = this.targetZ - this.z;

    // Calculate distance to target
    const targetDistance = Math.sqrt(target_dx ** 2 + target_dy ** 2 + target_dz ** 2);

    // Normalize and apply the targeting force
    if (targetDistance > 0) {
      this.velocity.vx += (target_dx / targetDistance) * targetWeight;
      this.velocity.vy += (target_dy / targetDistance) * targetWeight;
      this.velocity.vz += (target_dz / targetDistance) * targetWeight;
    }
  }
}







