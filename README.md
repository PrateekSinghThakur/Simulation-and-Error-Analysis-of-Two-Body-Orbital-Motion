# 🚀 Two-Body Orbital Motion Simulation & Error Analysis

🌐 **Live Interactive Demo:** https://projectnmc.netlify.app/

A MATLAB and React/TypeScript project that simulates the classical two-body gravitational problem using multiple numerical methods and evaluates their accuracy, stability, convergence, and conservation properties.

This project demonstrates the application of **Numerical Methods**, **Computational Physics**, and **Orbital Mechanics** through custom implementations of Euler, Runge-Kutta 4th Order (RK4), Predictor-Corrector methods, interpolation techniques, and an interactive web-based visualization platform.

---

## 📖 Overview

The two-body problem describes the motion of a body orbiting a much larger central mass under gravitational attraction.

The governing equation is:

```math
\ddot{\mathbf{r}} = -\frac{\mu \mathbf{r}}{|\mathbf{r}|^3}
```

where:

- **r** = Position vector
- **μ** = Standard gravitational parameter

The second-order differential equation is converted into a system of first-order ODEs and solved numerically using multiple algorithms.

---

## ✨ Highlights

- MATLAB implementation of Euler, RK4, Predictor-Corrector, and ode45 methods
- Interactive React + TypeScript simulation
- Circular, elliptical, and escape orbit scenarios
- Energy and angular momentum conservation analysis
- Convergence and error-order verification
- Lagrange interpolation for trajectory reconstruction
- Step-size sensitivity studies
- Comparison against MATLAB's adaptive ode45 solver
- Live browser-based visualization

---

## 🎯 Objectives

- Implement numerical ODE solvers from scratch
- Simulate circular, elliptical, and escape trajectories
- Analyze numerical accuracy and convergence
- Verify conservation of energy and angular momentum
- Compare custom solvers with MATLAB's ode45
- Demonstrate interpolation techniques for orbit reconstruction
- Create an interactive educational visualization platform

---

## 🛠 Numerical Methods Implemented

### Euler Method

- First-order explicit solver
- Computationally inexpensive
- Demonstrates numerical instability and energy drift

### Runge-Kutta 4th Order (RK4)

- Fourth-order accurate
- Excellent stability and conservation properties
- Produces highly accurate orbital trajectories

### Predictor-Corrector Method

- Adams-Bashforth / Adams-Moulton scheme
- Second-order accurate
- Good compromise between accuracy and computational cost

### MATLAB ode45

- Adaptive Runge-Kutta solver
- Used as a reference solution

---

## 🌎 Orbital Scenarios

### Circular Orbit

- Initial Position: `(1,0)`
- Initial Velocity: `(0,1)`
- Expected Result: Perfect circular orbit

### Elliptical Orbit

- Initial Position: `(1,0)`
- Initial Velocity: `(0,1.1172)`
- Expected Result: Stable elliptical orbit

### Parabolic Escape Orbit

- Initial Position: `(1,0)`
- Initial Velocity: `(0,1.4142)`
- Expected Result: Escape trajectory

---

## 📊 Key Results

### Convergence Study

| Method | Theoretical Order |
|----------|----------------|
| Euler | O(h) |
| Predictor-Corrector | O(h²) |
| RK4 | O(h⁴) |

The empirical convergence rates closely match theoretical expectations.

### Energy Conservation Performance

| Method | Relative Error |
|----------|--------------|
| Euler | 47.9% |
| Predictor-Corrector | 1.03% |
| RK4 | 0.0003% |

RK4 is approximately **172,000× more accurate** than Euler in conserving energy.

### Stability Comparison

| Method | Stability | Accuracy |
|----------|------------|------------|
| Euler | Poor | Low |
| Predictor-Corrector | Good | Moderate |
| RK4 | Excellent | High |
| ode45 | Excellent | Very High |

---

## 🌐 Interactive Web Simulation

A browser-based interactive simulation is included alongside the MATLAB implementation.

### Live Demo

🔗 https://projectnmc.netlify.app/

### Features

- Real-time orbital trajectory visualization
- Interactive parameter controls
- Numerical method comparison
- Convergence analysis plots
- Energy conservation monitoring
- Angular momentum analysis
- Step-size sensitivity visualization
- Mathematical formula reference panel

### Technologies Used

- React
- TypeScript
- Vite
- Custom Numerical Solvers
- Scientific Computing Algorithms

---

## 📂 Repository Structure

```text
two-body-orbital-motion/
│
├── matlab/
│   ├── main_simulation.m
│   ├── two_body_ode.m
│   ├── manual_solvers.m
│   ├── error_convergence.m
│   ├── analyze_invariants.m
│   ├── visualize_orbits.m
│   ├── lagrange_interp.m
│   └── demonstrate_interpolation.m
│
├── web-simulation/
│   ├── src/
│   │   ├── components/
│   │   ├── core/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── Report.pdf
├── README.md
└── LICENSE
```

---

## 📁 MATLAB File Descriptions

| File | Purpose |
|--------|----------|
| `main_simulation.m` | Master script that runs the entire project |
| `two_body_ode.m` | Governing equations of orbital motion |
| `manual_solvers.m` | Euler, RK4, and Predictor-Corrector implementations |
| `error_convergence.m` | Convergence and order-of-accuracy analysis |
| `analyze_invariants.m` | Energy and angular momentum conservation analysis |
| `visualize_orbits.m` | Orbit plotting and visualization |
| `lagrange_interp.m` | Lagrange interpolation implementation |
| `demonstrate_interpolation.m` | Interpolation demonstrations |

---

## ▶️ Running the MATLAB Project

### Prerequisites

- MATLAB R2021a or later
- All MATLAB files located in the same directory

### Clone the Repository

```bash
git clone https://github.com/your-username/two-body-orbital-motion.git
cd two-body-orbital-motion
```

### Open MATLAB

Run:

```matlab
main_simulation
```

### Generated Outputs

The script automatically:

- Simulates orbital motion
- Generates trajectory plots
- Performs convergence analysis
- Evaluates energy conservation
- Evaluates angular momentum conservation
- Demonstrates interpolation techniques
- Compares methods against ode45

---

## ▶️ Running Individual MATLAB Modules

### Convergence Analysis

```matlab
error_convergence
```

### Conservation Law Analysis

```matlab
analyze_invariants
```

### Orbit Visualization

```matlab
visualize_orbits
```

### Interpolation Demonstration

```matlab
demonstrate_interpolation
```

---

## ▶️ Running the Web Simulation

### Prerequisites

- Node.js 18+
- npm

### Install Dependencies

```bash
cd web-simulation
npm install
```

### Start Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

### Build for Production

```bash
npm run build
```

The optimized build will be generated in:

```text
dist/
```

---

## 📈 Generated Visualizations

### MATLAB

- Orbital trajectory plots
- Energy conservation graphs
- Angular momentum conservation graphs
- Convergence analysis plots
- Error comparison studies
- Radius evolution plots
- Step-size sensitivity analysis

### Web Simulation

- Interactive orbit visualization
- Real-time solver comparison
- Conservation law monitoring
- Convergence analysis charts
- Numerical method summary tables

---

## 🧠 Concepts Demonstrated

### Numerical Methods

- Euler Method
- Runge-Kutta 4th Order
- Predictor-Corrector Methods
- Adaptive ODE Solvers

### Error Analysis

- Local Truncation Error
- Global Error
- Richardson Extrapolation
- Convergence Verification

### Orbital Mechanics

- Two-Body Problem
- Circular Orbits
- Elliptical Orbits
- Escape Trajectories
- Conservation Laws

### Interpolation

- Lagrange Polynomial Interpolation
- Trajectory Reconstruction
- Sparse Data Approximation

### Software Engineering

- MATLAB Scientific Computing
- React Component Architecture
- TypeScript Development
- Interactive Data Visualization
- Physics Simulation Design

---

## 🔮 Future Enhancements

- Adaptive RK4 implementation
- Symplectic integrators
- Three-body problem simulation
- Relativistic corrections
- 3D orbit visualization
- Orbit animation
- Parallelized simulations
- GPU acceleration
- Real astronomical datasets

---

## 📚 References

1. Chapra & Canale — *Numerical Methods for Engineers*
2. Curtis — *Orbital Mechanics for Engineering Students*
3. Butcher — *Numerical Methods for Ordinary Differential Equations*
4. MATLAB Documentation

---
