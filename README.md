# 🚀 Two-Body Orbital Motion Simulation & Error Analysis

A MATLAB project that simulates the classical two-body gravitational problem using multiple numerical methods and evaluates their accuracy, stability, convergence, and conservation properties.

This project demonstrates the application of Numerical Methods to Orbital Mechanics through custom implementations of Euler, Runge-Kutta 4th Order (RK4), Predictor-Corrector methods, and comparison with MATLAB's built-in `ode45` solver.

---

## 📖 Overview

The two-body problem describes the motion of a body orbiting a much larger central mass under gravitational attraction.

The governing equation is:

\[
\ddot{\mathbf{r}} = -\frac{\mu \mathbf{r}}{|\mathbf{r}|^3}
\]

where:

- **r** = Position vector
- **μ** = Standard gravitational parameter

The second-order differential equation is converted into a system of first-order ODEs and solved numerically.

---

## 🎯 Objectives

- Implement numerical ODE solvers from scratch
- Simulate circular, elliptical, and escape trajectories
- Analyze numerical accuracy and convergence
- Verify conservation of energy and angular momentum
- Compare custom solvers with MATLAB's `ode45`
- Demonstrate interpolation techniques for orbit reconstruction

---

## 🛠 Numerical Methods Implemented

### 1. Euler Method
- First-order explicit solver
- Computationally inexpensive
- Demonstrates numerical instability and energy drift

### 2. Runge-Kutta 4th Order (RK4)
- Fourth-order accurate
- Excellent stability and conservation properties
- Produces highly accurate orbital trajectories

### 3. Predictor-Corrector Method
- Adams-Bashforth / Adams-Moulton scheme
- Second-order accurate
- Good compromise between accuracy and computational cost

### 4. MATLAB ode45
- Adaptive Runge-Kutta solver
- Used as a reference solution

---

## 📂 Project Structure

```text
.
├── main_simulation.m
├── two_body_ode.m
├── manual_solvers.m
├── error_convergence.m
├── analyze_invariants.m
├── visualize_orbits.m
├── lagrange_interp.m
├── demonstrate_interpolation.m
├── Report.pdf
└── README.md
```

### File Descriptions

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

---

### Energy Conservation Performance

| Method | Relative Error |
|----------|--------------|
| Euler | 47.9% |
| Predictor-Corrector | 1.03% |
| RK4 | 0.0003% |

RK4 is approximately **172,000× more accurate** than Euler in conserving energy.

---

### Stability Comparison

| Method | Stability | Accuracy |
|----------|------------|------------|
| Euler | Poor | Low |
| Predictor-Corrector | Good | Moderate |
| RK4 | Excellent | High |
| ode45 | Excellent | Very High |

---

## ▶️ How to Run

### Clone the Repository

```bash
git clone https://github.com/your-username/two-body-orbital-motion.git
cd two-body-orbital-motion
```

### Open MATLAB

Navigate to the project folder and run:

```matlab
main_simulation
```

The script will automatically:

- Simulate orbital motion
- Generate trajectory plots
- Analyze conservation laws
- Perform convergence studies
- Demonstrate interpolation methods

---

## 📈 Generated Outputs

The project produces:

- Orbital trajectory plots
- Energy conservation graphs
- Angular momentum analysis
- Convergence studies
- Error comparison plots
- Step-size sensitivity analysis
- Interpolation visualizations

---

## 🧠 Concepts Demonstrated

### Numerical Methods
- Euler Method
- Runge-Kutta Methods
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

---

## 🔮 Future Enhancements

- Adaptive RK4 implementation
- Symplectic integrators
- Three-body problem simulation
- Relativistic corrections
- 3D orbit visualization
- Orbit animation
- Parallelized simulations

---

## 📚 References

1. Chapra & Canale — *Numerical Methods for Engineers*
2. Curtis — *Orbital Mechanics for Engineering Students*
3. Butcher — *Numerical Methods for Ordinary Differential Equations*
4. MATLAB Documentation
---

## ▶️ How to Run

### Prerequisites

- MATLAB R2021a or later (any recent version should work)
- All project `.m` files located in the same directory

### Setup

1. Clone or download the repository:

```bash
git clone https://github.com/your-username/two-body-orbital-motion.git
cd two-body-orbital-motion
```

2. Open MATLAB.

3. Set the project folder as the current working directory:

```matlab
cd('path/to/two-body-orbital-motion')
```

4. Verify that all required files are present:

```matlab
dir
```

You should see:

```text
main_simulation.m
two_body_ode.m
manual_solvers.m
error_convergence.m
analyze_invariants.m
visualize_orbits.m
lagrange_interp.m
demonstrate_interpolation.m
```

### Run the Complete Project

Execute the master script:

```matlab
main_simulation
```

This will automatically:

- Simulate orbital motion using Euler, RK4, and Predictor-Corrector methods
- Generate orbit trajectory plots
- Perform convergence analysis
- Evaluate energy conservation
- Evaluate angular momentum conservation
- Compare results with MATLAB's `ode45`
- Generate error and stability visualizations

### Run Individual Modules

#### Convergence Analysis

```matlab
error_convergence
```

Generates:
- Error vs step-size plots
- Empirical order-of-accuracy estimates
- Richardson extrapolation results

#### Conservation Law Analysis

```matlab
analyze_invariants
```

Generates:
- Energy evolution plots
- Angular momentum evolution plots
- Relative error analysis

#### Orbit Visualization

```matlab
visualize_orbits
```

Generates:
- Circular orbit trajectories
- Method comparisons
- Radius evolution plots
- Step-size sensitivity studies

#### Interpolation Demonstration

```matlab
demonstrate_interpolation
```

Generates:
- Lagrange interpolation examples
- Orbit reconstruction from sparse samples

### Troubleshooting

#### "Function not found" Error

Ensure all `.m` files are located in the same MATLAB directory:

```matlab
pwd
dir
```

#### Missing Figures

Enable figure windows:

```matlab
set(0,'DefaultFigureVisible','on')
```

#### Path Issues

Add the project folder to MATLAB's search path:

```matlab
addpath(genpath(pwd))
```

### Expected Results

After successful execution, you should observe:

✅ Stable circular orbit with RK4
✅ Noticeable energy drift with Euler
✅ Conservation of angular momentum
✅ Fourth-order convergence behavior for RK4
✅ Interpolation-based trajectory reconstruction
✅ Multiple analysis and visualization figures
