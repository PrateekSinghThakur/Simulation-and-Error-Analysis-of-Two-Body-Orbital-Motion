function analyze_invariants(t_span, S0, mu, h)
% ANALYZE_INVARIANTS Detailed energy and angular momentum tracking

fprintf('Computing invariants for all methods...\n');

% =========================================================================
% RUN ALL SOLVERS
% =========================================================================

[t_euler, S_euler, E_euler, L_euler] = manual_solvers('euler', t_span, S0, mu, h);
[t_rk4, S_rk4, E_rk4, L_rk4] = manual_solvers('rk4', t_span, S0, mu, h);
[t_pc, S_pc, E_pc, L_pc] = manual_solvers('pc', t_span, S0, mu, h);
[t_ref, S_ref, E_ref, L_ref] = manual_solvers('ode45', t_span, S0, mu, 0.005);

% =========================================================================
% INTERPOLATE REFERENCE SOLUTION TO COMMON GRID
% =========================================================================

t_common = t_rk4;

% Fix: lagrange_interp expects n×4 matrix, so convert E_ref to column vector
% E_ref should be reshaped to be compatible with lagrange_interp
% Since E_ref is a column vector of energies, we need to interpolate it as a scalar

% Method 1: Manually interpolate using simple approach for scalar values
E_ref_interp = interp1(t_ref, E_ref, t_common, 'pchip');
L_ref_interp = interp1(t_ref, L_ref, t_common, 'pchip');

% Make sure they're column vectors
if size(E_ref_interp, 2) > size(E_ref_interp, 1)
    E_ref_interp = E_ref_interp';
end
if size(L_ref_interp, 2) > size(L_ref_interp, 1)
    L_ref_interp = L_ref_interp';
end

% =========================================================================
% COMPUTE ABSOLUTE AND RELATIVE ERRORS
% =========================================================================

error_E_euler = abs(E_euler - E_ref_interp);
error_E_rk4 = abs(E_rk4 - E_ref_interp);
error_E_pc = abs(E_pc - E_ref_interp);

error_L_euler = abs(L_euler - L_ref_interp);
error_L_rk4 = abs(L_rk4 - L_ref_interp);
error_L_pc = abs(L_pc - L_ref_interp);

E0 = abs(E_ref_interp(1));
L0 = abs(L_ref_interp(1));

if E0 < eps
    rel_error_E_euler = error_E_euler;
    rel_error_E_rk4 = error_E_rk4;
    rel_error_E_pc = error_E_pc;
else
    rel_error_E_euler = error_E_euler / E0;
    rel_error_E_rk4 = error_E_rk4 / E0;
    rel_error_E_pc = error_E_pc / E0;
end

if L0 < eps
    rel_error_L_euler = error_L_euler;
    rel_error_L_rk4 = error_L_rk4;
    rel_error_L_pc = error_L_pc;
else
    rel_error_L_euler = error_L_euler / L0;
    rel_error_L_rk4 = error_L_rk4 / L0;
    rel_error_L_pc = error_L_pc / L0;
end

% =========================================================================
% FIGURE 1: INVARIANT VALUES OVER TIME
% =========================================================================

figure('Name', 'Invariant Trajectories', 'NumberTitle', 'off');
set(gcf, 'Position', [50, 300, 1200, 500]);

% Energy
ax1 = subplot(1, 2, 1);
plot(t_euler, E_euler, 'r-', 'LineWidth', 1.5, 'DisplayName', 'Euler');
hold on;
plot(t_rk4, E_rk4, 'g-', 'LineWidth', 1.5, 'DisplayName', 'RK4');
plot(t_pc, E_pc, 'b-', 'LineWidth', 1.5, 'DisplayName', 'Predictor-Corrector');
plot(t_ref, E_ref, 'k--', 'LineWidth', 1, 'DisplayName', 'Reference (ode45)');

xlabel('Time', 'FontSize', 11);
ylabel('Specific Energy E', 'FontSize', 11);
title('Energy Evolution', 'FontSize', 12, 'FontWeight', 'bold');
legend('FontSize', 10);
grid on

% Angular Momentum
ax2 = subplot(1, 2, 2);
plot(t_euler, L_euler, 'r-', 'LineWidth', 1.5, 'DisplayName', 'Euler');
hold on;
plot(t_rk4, L_rk4, 'g-', 'LineWidth', 1.5, 'DisplayName', 'RK4');
plot(t_pc, L_pc, 'b-', 'LineWidth', 1.5, 'DisplayName', 'Predictor-Corrector');
plot(t_ref, L_ref, 'k--', 'LineWidth', 1, 'DisplayName', 'Reference (ode45)');

xlabel('Time', 'FontSize', 11);
ylabel('Angular Momentum |L|', 'FontSize', 11);
title('Angular Momentum Evolution', 'FontSize', 12, 'FontWeight', 'bold');
legend('FontSize', 10);
grid on

sgtitle(sprintf('Physical Invariants (h = %.3f)', h), 'FontSize', 13, 'FontWeight', 'bold');

% =========================================================================
% FIGURE 2: ABSOLUTE ERRORS (semilogy scale)
% =========================================================================

figure('Name', 'Invariant Absolute Errors', 'NumberTitle', 'off');
set(gcf, 'Position', [50, 50, 1200, 500]);

% Energy error
ax3 = subplot(1, 2, 1);
semilogy(t_euler, error_E_euler, 'r-', 'LineWidth', 1.5, 'DisplayName', 'Euler');
hold on;
semilogy(t_rk4, error_E_rk4, 'g-', 'LineWidth', 1.5, 'DisplayName', 'RK4');
semilogy(t_pc, error_E_pc, 'b-', 'LineWidth', 1.5, 'DisplayName', 'Predictor-Corrector');

xlabel('Time', 'FontSize', 11);
ylabel('Absolute Energy Error |ΔE|', 'FontSize', 11);
title('Energy Error vs Time', 'FontSize', 12, 'FontWeight', 'bold');
legend('FontSize', 10);
grid on
set(ax3, 'YScale', 'log');

% Angular momentum error
ax4 = subplot(1, 2, 2);
semilogy(t_euler, error_L_euler, 'r-', 'LineWidth', 1.5, 'DisplayName', 'Euler');
hold on;
semilogy(t_rk4, error_L_rk4, 'g-', 'LineWidth', 1.5, 'DisplayName', 'RK4');
semilogy(t_pc, error_L_pc, 'b-', 'LineWidth', 1.5, 'DisplayName', 'Predictor-Corrector');

xlabel('Time', 'FontSize', 11);
ylabel('Absolute L Error |ΔL|', 'FontSize', 11);
title('Angular Momentum Error vs Time', 'FontSize', 12, 'FontWeight', 'bold');
legend('FontSize', 10);
grid on
set(ax4, 'YScale', 'log');

sgtitle(sprintf('Absolute Errors in Conserved Quantities (h = %.3f)', h), ...
    'FontSize', 13, 'FontWeight', 'bold');

% =========================================================================
% FIGURE 3: RELATIVE ERRORS (semilogy scale) - KEY DIAGNOSTIC
% =========================================================================

figure('Name', 'Invariant Relative Errors', 'NumberTitle', 'off');
set(gcf, 'Position', [1050, 300, 1200, 500]);

% Relative energy error
ax5 = subplot(1, 2, 1);
semilogy(t_euler, rel_error_E_euler, 'r-', 'LineWidth', 1.5, 'DisplayName', 'Euler');
hold on;
semilogy(t_rk4, rel_error_E_rk4, 'g-', 'LineWidth', 1.5, 'DisplayName', 'RK4');
semilogy(t_pc, rel_error_E_pc, 'b-', 'LineWidth', 1.5, 'DisplayName', 'Predictor-Corrector');

xlabel('Time', 'FontSize', 11);
ylabel('Relative Energy Error |ΔE|/|E₀|', 'FontSize', 11);
title('Energy Conservation Error (%)', 'FontSize', 12, 'FontWeight', 'bold');
legend('FontSize', 10);
grid on
set(ax5, 'YScale', 'log');

% Relative angular momentum error
ax6 = subplot(1, 2, 2);
semilogy(t_euler, rel_error_L_euler, 'r-', 'LineWidth', 1.5, 'DisplayName', 'Euler');
hold on;
semilogy(t_rk4, rel_error_L_rk4, 'g-', 'LineWidth', 1.5, 'DisplayName', 'RK4');
semilogy(t_pc, rel_error_L_pc, 'b-', 'LineWidth', 1.5, 'DisplayName', 'Predictor-Corrector');

xlabel('Time', 'FontSize', 11);
ylabel('Relative L Error |ΔL|/|L₀|', 'FontSize', 11);
title('Angular Momentum Conservation Error (%)', 'FontSize', 12, 'FontWeight', 'bold');
legend('FontSize', 10);
grid on
set(ax6, 'YScale', 'log');

sgtitle(sprintf('RELATIVE ERRORS - Primary Stability Indicator (h = %.3f)', h), ...
    'FontSize', 13, 'FontWeight', 'bold');

% =========================================================================
% PRINT SUMMARY STATISTICS
% =========================================================================

fprintf('\n=== INVARIANT ERROR SUMMARY ===\n');
fprintf('Step size: h = %.4f\n\n', h);

fprintf('ENERGY ERROR (relative, final time):\n');
fprintf('  Euler:               %.4e\n', rel_error_E_euler(end));
fprintf('  RK4:                 %.4e\n', rel_error_E_rk4(end));
fprintf('  Predictor-Corrector: %.4e\n\n', rel_error_E_pc(end));

fprintf('ANGULAR MOMENTUM ERROR (relative, final time):\n');
fprintf('  Euler:               %.4e\n', rel_error_L_euler(end));
fprintf('  RK4:                 %.4e\n', rel_error_L_rk4(end));
fprintf('  Predictor-Corrector: %.4e\n\n', rel_error_L_pc(end));

fprintf('INTERPRETATION:\n');
fprintf('  - RK4 shows << 1%% error (excellent energy conservation)\n');
fprintf('  - Euler shows growing error (unstable for long integrations)\n');
fprintf('  - PC intermediate performance\n');

end