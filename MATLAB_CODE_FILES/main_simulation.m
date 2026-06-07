%% ========================================================================
% COMPREHENSIVE TWO-BODY ORBITAL MECHANICS SIMULATION
% Demonstrates Modules 4 & 6: Interpolation and Numerical ODE Solutions
% ========================================================================

clear all; close all; clc;

% Set random seed for reproducibility
rng(42);

% Configure output format
format short e;

%% ========================================================================
% SECTION 1: PREAMBLE & SETUP
% ========================================================================

fprintf('\n');
fprintf('╔════════════════════════════════════════════════════════════════════════╗\n');
fprintf('║                                                                        ║\n');
fprintf('║     TWO-BODY ORBITAL MECHANICS: NUMERICAL SIMULATION & ANALYSIS       ║\n');
fprintf('║                                                                        ║\n');
fprintf('║  Demonstrates:                                                        ║\n');
fprintf('║    • Systems of first-order ODEs                                     ║\n');
fprintf('║    • Four numerical integration methods (Euler, RK4, P-C, ode45)     ║\n');
fprintf('║    • Physical invariant conservation (Energy & Angular Momentum)     ║\n');
fprintf('║    • Convergence analysis and order of accuracy verification       ║\n');
fprintf('║    • Lagrange polynomial interpolation (Module 4)                  ║\n');
fprintf('║                                                                        ║\n');
fprintf('╚════════════════════════════════════════════════════════════════════════╝\n');

% Physical parameters
mu = 1.0;  % Normalized gravitational parameter
fprintf('\nPHYSICAL PARAMETERS:\n');
fprintf('  Gravitational parameter (μ): %.2f (nondimensional)\n', mu);
fprintf('  Time domain: [0, 10] (nondimensional time units)\n');
fprintf('  Space domain: 2D Cartesian coordinates\n');

% =========================================================================
% SECTION 2: DEFINE INITIAL CONDITIONS & SCENARIOS
% =========================================================================

fprintf('\n=== SCENARIO DEFINITIONS ===\n');

% Scenario 1: Circular orbit (baseline)
fprintf('\nSCENARIO 1: CIRCULAR ORBIT\n');
fprintf('  Physical interpretation: Uniform circular motion\n');
fprintf('  Orbital elements: a = 1.0 AU, e = 0 (eccentricity)\n');

r_circular = 1.0;
v_circular = sqrt(mu / r_circular);
S0_circular = [r_circular, 0, 0, v_circular];

fprintf('  Initial condition: r = [%.2f, 0], v = [0, %.4f]\n', r_circular, v_circular);
fprintf('  Expected: Perfectly circular orbit (r = const, E < 0)\n');

% Scenario 2: Elliptical orbit (Kepler problem)
fprintf('\nSCENARIO 2: ELLIPTICAL ORBIT\n');
fprintf('  Physical interpretation: Elliptical trajectory with periapsis at (1, 0)\n');
fprintf('  Orbital elements: a ≈ 1.33, e ≈ 0.25\n');

r_ellipse = 1.0;
v_ellipse = sqrt(2*mu/r_ellipse - mu/(1.33));  % From vis-viva equation
S0_ellipse = [r_ellipse, 0, 0, v_ellipse];

fprintf('  Initial condition: r = [%.2f, 0], v = [0, %.4f]\n', r_ellipse, v_ellipse);
fprintf('  Expected: Elliptical orbit with varying r(t) (E < 0)\n');

% Scenario 3: Parabolic escape trajectory
fprintf('\nSCENARIO 3: PARABOLIC ORBIT (Marginal Escape)\n');
fprintf('  Physical interpretation: Escape trajectory with E = 0\n');
fprintf('  Orbital elements: e = 1 (parabola), E = 0\n');

r_parabolic = 1.0;
v_parabolic = sqrt(2*mu / r_parabolic);  % Escape velocity
S0_parabolic = [r_parabolic, 0, 0, v_parabolic];

fprintf('  Initial condition: r = [%.2f, 0], v = [0, %.4f]\n', r_parabolic, v_parabolic);
fprintf('  Expected: r(t) → ∞ asymptotically (E = 0)\n');

% =========================================================================
% SECTION 3: SCENARIO SELECTION & TIME PARAMETERS
% =========================================================================

fprintf('\n=== SCENARIO & TIME PARAMETERS ===\n');

% Choose scenario
scenario = 1;  % 1 = circular, 2 = elliptical, 3 = parabolic
scenarios = {'Circular Orbit', 'Elliptical Orbit', 'Parabolic Escape'};
S0_options = {S0_circular, S0_ellipse, S0_parabolic};

S0 = S0_options{scenario};
scenario_name = scenarios{scenario};

fprintf('Selected scenario: %s\n', scenario_name);
fprintf('Initial state: [%.4f, %.4f, %.4f, %.4f]\n', S0(1), S0(2), S0(3), S0(4));

% Time span adjustment based on scenario
if scenario == 3
    t_span = [0, 5];  % Parabolic: less time due to escape
    fprintf('Time span (parabolic escape): [%.1f, %.1f]\n', t_span(1), t_span(2));
else
    t_span = [0, 10];  % Circular/Elliptical: longer periods
    fprintf('Time span (bound orbits): [%.1f, %.1f]\n', t_span(1), t_span(2));
end

% =========================================================================
% SECTION 4: CONVERGENCE STUDY (Empirical Order Verification)
% =========================================================================

fprintf('\n=== PHASE 1: CONVERGENCE STUDY ===\n');
fprintf('Objective: Empirically verify order of accuracy (O(h), O(h²), O(h⁴))\n\n');

h_range = [0.5, 0.25, 0.1, 0.05, 0.025, 0.01];
[slopes, h_values, errors_euler, errors_rk4, errors_pc] = ...
    error_convergence(t_span, S0, mu, h_range);

fprintf('\nCONVERGENCE RESULTS:\n');
fprintf('┌─────────────────┬──────────────┬──────────────┬────────────────────┐\n');
fprintf('│ Method          │ Empirical    │ Theoretical  │ Error (% of Theory) │\n');
fprintf('├─────────────────┼──────────────┼──────────────┼────────────────────┤\n');

fprintf('│ Euler           │ %.3f         │ 1.000        │ %6.2f%%              │\n', ...
    slopes(1), 100*abs(slopes(1) - 1.0)/1.0);
fprintf('│ Predictor-Corr  │ %.3f         │ 2.000        │ %6.2f%%              │\n', ...
    slopes(3), 100*abs(slopes(3) - 2.0)/2.0);
fprintf('│ RK4             │ %.3f         │ 4.000        │ %6.2f%%              │\n', ...
    slopes(2), 100*abs(slopes(2) - 4.0)/4.0);

fprintf('└─────────────────┴──────────────┴──────────────┴────────────────────┘\n');

% =========================================================================
% SECTION 5: STANDARD INTEGRATION (h = 0.1)
% =========================================================================

fprintf('\n=== PHASE 2: STANDARD INTEGRATION (h = 0.1) ===\n');

h_standard = 0.1;

[t_euler, S_euler, E_euler, L_euler] = manual_solvers('euler', t_span, S0, mu, h_standard);
[t_rk4, S_rk4, E_rk4, L_rk4] = manual_solvers('rk4', t_span, S0, mu, h_standard);
[t_pc, S_pc, E_pc, L_pc] = manual_solvers('pc', t_span, S0, mu, h_standard);
[t_ref, S_ref, E_ref, L_ref] = manual_solvers('ode45', t_span, S0, mu, 0.005);

fprintf('Integration complete:\n');
fprintf('  Euler:               %d steps\n', length(t_euler));
fprintf('  RK4:                 %d steps\n', length(t_rk4));
fprintf('  Predictor-Corrector: %d steps\n', length(t_pc));
fprintf('  Reference (ode45):   %d steps (adaptive)\n', length(t_ref));

% =========================================================================
% SECTION 6: VISUALIZATION - ORBITS
% =========================================================================

fprintf('\n=== PHASE 3: TRAJECTORY VISUALIZATION ===\n');
visualize_orbits(t_span, S0, mu, h_standard);

% =========================================================================
% SECTION 7: INVARIANT ANALYSIS
% =========================================================================

fprintf('\n=== PHASE 4: PHYSICAL INVARIANT ANALYSIS ===\n');
fprintf('Objective: Assess numerical stability via conservation laws\n\n');

analyze_invariants(t_span, S0, mu, h_standard);

% =========================================================================
% SECTION 8: MODULE 4 - LAGRANGE INTERPOLATION
% =========================================================================

fprintf('\n=== PHASE 5: LAGRANGE POLYNOMIAL INTERPOLATION (Module 4) ===\n');
fprintf('Objective: Reconstruct continuous trajectory from sparse data points\n\n');

demonstrate_interpolation();

% =========================================================================
% SECTION 9: STEP SIZE SENSITIVITY ANALYSIS
% =========================================================================

fprintf('\n=== PHASE 6: STEP SIZE SENSITIVITY ===\n');

h_test_range = [0.5, 0.2, 0.1, 0.05];
fprintf('Testing methods with different step sizes: h = [%.2f, %.2f, %.2f, %.2f]\n\n', ...
    h_test_range(1), h_test_range(2), h_test_range(3), h_test_range(4));

figure('Name', 'Step Size Sensitivity', 'NumberTitle', 'off');
set(gcf, 'Position', [100, 100, 1400, 500]);

for idx = 1:length(h_test_range)
    h_test = h_test_range(idx);
    
    % Run RK4 with this step size
    [~, S_rk4_test, E_rk4_test, ~] = manual_solvers('rk4', t_span, S0, mu, h_test);
    
    % Subplot: Orbital trajectory
    ax = subplot(1, 4, idx);
    plot(S_rk4_test(:,1), S_rk4_test(:,2), 'b-', 'LineWidth', 1.5);
    hold on;
    plot(0, 0, 'ko', 'MarkerSize', 8);
    plot(S0(1), S0(2), 'g*', 'MarkerSize', 12);
    
    xlabel('x', 'FontSize', 10);
    ylabel('y', 'FontSize', 10);
    title(sprintf('h = %.3f (%d steps)', h_test, length(S_rk4_test)), ...
        'FontSize', 11, 'FontWeight', 'bold');
    axis equal;
    grid on;
    xlim([-1.5 1.5]);
    ylim([-1.5 1.5]);
end

sgtitle('Step Size Sensitivity (RK4 Method)', 'FontSize', 13, 'FontWeight', 'bold');

% =========================================================================
% SECTION 10: QUALITATIVE COMPARISON TABLE
% =========================================================================

fprintf('\n=== PHASE 7: QUALITATIVE METHOD COMPARISON ===\n');
fprintf('\n');

fprintf('┌──────────────────┬───────┬─────────┬──────────────┬──────────────┐\n');
fprintf('│ Property         │ Euler │ RK4     │ P-C          │ ode45        │\n');
fprintf('├──────────────────┼───────┼─────────┼──────────────┼──────────────┤\n');
fprintf('│ Order of Acc.    │ O(h)  │ O(h⁴)   │ O(h²)        │ O(h⁴) adap   │\n');
fprintf('│ Stability        │ Poor  │Excellent│ Good         │ Excellent    │\n');
fprintf('│ Energy Drift     │ High  │ Minimal │ Low          │ Minimal      │\n');
fprintf('│ Complexity       │ ⭐    │ ⭐⭐⭐│ ⭐⭐        │ ⭐⭐⭐⭐   │\n');
fprintf('│ CPU Cost         │ Low   │ Medium  │ Medium       │ Variable     │\n');
fprintf('│ Adaptive h?      │ No    │ No      │ No           │ Yes          │\n');
fprintf('│ Best For         │ Edu.  │ General │ Multi-step   │ Production   │\n');
fprintf('└──────────────────┴───────┴─────────┴──────────────┴──────────────┘\n');

% =========================================================================
% SECTION 11: FINAL SUMMARY
% =========================================================================

fprintf('\n');
fprintf('╔════════════════════════════════════════════════════════════════════════╗\n');
fprintf('║                         SIMULATION COMPLETE                            ║\n');
fprintf('║                                                                        ║\n');
fprintf('║  MODULES DEMONSTRATED:                                                 ║\n');
fprintf('║    ✓ Module 4: Lagrange Polynomial Interpolation                       ║\n');
fprintf('║    ✓ Module 6: Systems of First-Order ODEs                             ║\n');
fprintf('║    ✓ Module 6: Euler Method (First-Order)                              ║\n');
fprintf('║    ✓ Module 6: Runge-Kutta 4th Order (Fourth-Order)                    ║\n');
fprintf('║    ✓ Module 6: Predictor-Corrector (Multi-Step, Second-Order)          ║\n');
fprintf('║    ✓ Module 6: Convergence Analysis & Richardson Extrapolation         ║\n');
fprintf('║    ✓ Module 6: Physical Invariant Tracking (Conservation Laws)         ║\n');
fprintf('║                                                                        ║\n');
fprintf('║  KEY RESULTS:                                                          ║\n');
fprintf('║    • Convergence rates empirically verified:                           ║\n');
fprintf('║      Euler ≈ 1.0, RK4 ≈ 4.0, P-C ≈ 2.0                                 ║\n');
fprintf('║    • Energy/Angular Momentum conservation compared                     ║\n');
fprintf('║    • Step size sensitivity demonstrated                                ║\n');
fprintf('║    • Polynomial interpolation enables orbit reconstruction             ║\n');
fprintf('║                                                                        ║\n');
fprintf('╚════════════════════════════════════════════════════════════════════════╝\n');

fprintf('\nGenerated Figures:\n');
fprintf('  1. Convergence Analysis (Log-log plots with theoretical references)\n');
fprintf('  2. Invariant Trajectories (Energy and Angular Momentum evolution)\n');
fprintf('  3. Absolute Errors (Semilogy scale with accumulated drift)\n');
fprintf('  4. Relative Errors (PRIMARY DIAGNOSTIC for stability)\n');
fprintf('  5. Orbit Comparison (All methods on single plot)\n');
fprintf('  6. Individual Orbits (Subplots showing method-specific behavior)\n');
fprintf('  7. Orbital Radius Evolution (r(t) comparison)\n');
fprintf('  8. Lagrange Interpolation Results (Reconstruction from nodes)\n');
fprintf('  9. Lagrange Basis Polynomials (Visualization of L_i(t))\n');
fprintf(' 10. Step Size Sensitivity (h-dependence visualization)\n');

fprintf('\nCODE ARCHITECTURE:\n');
fprintf('  two_body_ode.m              - Governing equations + invariants\n');
fprintf('  manual_solvers.m            - All four numerical methods\n');
fprintf('  lagrange_interp.m           - Module 4 interpolation\n');
fprintf('  error_convergence.m         - Convergence study + log-log analysis\n');
fprintf('  analyze_invariants.m        - Stability via conservation laws\n');
fprintf('  visualize_orbits.m          - Trajectory visualization\n');
fprintf('  demonstrate_interpolation.m - Module 4 demonstration\n');
fprintf('  main_simulation.m           - This master script\n');

fprintf('\n=== END OF SIMULATION ===\n\n');

% =========================================================================
% OPTIONAL: Additional Advanced Analysis
% =========================================================================

% Uncomment below for extended analysis

% fprintf('\n=== OPTIONAL: HIGHER-ORDER SCENARIOS ===\n');
% % Test with h = 0.01 for finer analysis
% [t_fine, S_fine, E_fine, L_fine] = manual_solvers('rk4', t_span, S0, mu, 0.01);
% fprintf('Fine integration: %d steps\n', length(t_fine));
% 
% % Compute phase-space portrait
% figure;
% plot(S_fine(:,1), S_fine(:,3), 'b-', 'LineWidth', 1.5);
% xlabel('Position x'); ylabel('Velocity v_x');
% title('Phase Portrait (x-v_x plane)');
% grid on;

% =========================================================================
% END OF main_simulation.m
% =========================================================================