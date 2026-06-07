function [slopes, h_values, errors_euler, errors_rk4, errors_pc] = ...
    error_convergence(t_span, S0, mu, h_range)
% ERROR_CONVERGENCE Rigorous convergence study and order of accuracy verification

fprintf('\n=== CONVERGENCE STUDY ===\n');
fprintf('Reference solution computation...\n');

% =========================================================================
% STEP 1: GENERATE REFERENCE SOLUTION (Very fine step)
% =========================================================================

h_ref = 0.001;
[~, S_ref, ~, ~] = manual_solvers('rk4', t_span, S0, mu, h_ref);
S_final_ref = S_ref(end, :);

fprintf('  Reference solution: S_final = [%.6f, %.6f, %.6f, %.6f]\n', ...
    S_final_ref(1), S_final_ref(2), S_final_ref(3), S_final_ref(4));

% =========================================================================
% STEP 2: COMPUTE ERRORS FOR EACH STEP SIZE
% =========================================================================

n_h = length(h_range);
errors_euler = zeros(n_h, 1);
errors_rk4 = zeros(n_h, 1);
errors_pc = zeros(n_h, 1);

fprintf('\nIntegrating with varying step sizes:\n');
fprintf('%-8s | %-12s | %-12s | %-12s | %-12s\n', 'h', 'Euler Error', 'RK4 Error', 'PC Error', 'Ratio (RK4/E)');
fprintf(repmat('-', 1, 70));
fprintf('\n');

for i = 1:n_h
    h = h_range(i);
    
    [~, S_euler, ~, ~] = manual_solvers('euler', t_span, S0, mu, h);
    S_final_euler = S_euler(end, :);
    errors_euler(i) = norm(S_final_euler - S_final_ref);
    
    [~, S_rk4, ~, ~] = manual_solvers('rk4', t_span, S0, mu, h);
    S_final_rk4 = S_rk4(end, :);
    errors_rk4(i) = norm(S_final_rk4 - S_final_ref);
    
    [~, S_pc, ~, ~] = manual_solvers('pc', t_span, S0, mu, h);
    S_final_pc = S_pc(end, :);
    errors_pc(i) = norm(S_final_pc - S_final_ref);
    
    if errors_euler(i) > 1e-15
        ratio = errors_rk4(i) / errors_euler(i);
    else
        ratio = 0;
    end
    
    fprintf('%.4f | %12.4e | %12.4e | %12.4e | %12.2f\n', ...
        h, errors_euler(i), errors_rk4(i), errors_pc(i), ratio);
end

% =========================================================================
% STEP 3: COMPUTE CONVERGENCE RATES
% =========================================================================

fprintf('\nConvergence rate computation:\n');

h_values = h_range(:);

coeffs_euler = polyfit(log(h_values), log(errors_euler), 1);
slope_euler = coeffs_euler(1);

coeffs_rk4 = polyfit(log(h_values), log(errors_rk4), 1);
slope_rk4 = coeffs_rk4(1);

coeffs_pc = polyfit(log(h_values), log(errors_pc), 1);
slope_pc = coeffs_pc(1);

slopes = [slope_euler; slope_rk4; slope_pc];

% =========================================================================
% STEP 4: DISPLAY CONVERGENCE ANALYSIS
% =========================================================================

fprintf('\nEmpirical Order of Accuracy (from log-log slope):\n');
fprintf('  Euler:               %.3f  (theoretical: 1.000)\n', slope_euler);
fprintf('  RK4:                 %.3f  (theoretical: 4.000)\n', slope_rk4);
fprintf('  Predictor-Corrector: %.3f  (theoretical: 2.000)\n', slope_pc);

fprintf('\nInterpretation:\n');
fprintf('  Euler slope ≈ 1.0   → Error decreases linearly with h\n');
fprintf('  PC slope ≈ 2.0      → Error decreases quadratically with h\n');
fprintf('  RK4 slope ≈ 4.0     → Error decreases with h⁴\n');

fprintf('\nAdvantage of higher-order methods:\n');
fprintf('  Halving h (h→h/2):\n');
fprintf('    Euler:   error × 1/2 (linear improvement)\n');
fprintf('    PC:      error × 1/4 (quadratic improvement)\n');
fprintf('    RK4:     error × 1/16 (quartic improvement)\n');

% =========================================================================
% STEP 5: GENERATE CONVERGENCE PLOT (MATLAB 2025B COMPATIBLE)
% =========================================================================

figure('Name', 'Convergence Analysis', 'NumberTitle', 'off');
set(gcf, 'Position', [100, 100, 1200, 700]);

% Main convergence plot
ax1 = subplot(1, 2, 1);
hold on;

% Plot actual errors
loglog(h_values, errors_euler, 'o-', 'LineWidth', 2.5, 'MarkerSize', 8, ...
    'Color', [0.8 0 0], 'DisplayName', sprintf('Euler (slope=%.2f)', slope_euler));
loglog(h_values, errors_rk4, 's-', 'LineWidth', 2.5, 'MarkerSize', 8, ...
    'Color', [0 0.7 0], 'DisplayName', sprintf('RK4 (slope=%.2f)', slope_rk4));
loglog(h_values, errors_pc, '^-', 'LineWidth', 2.5, 'MarkerSize', 8, ...
    'Color', [0 0 0.8], 'DisplayName', sprintf('Predictor-Corrector (slope=%.2f)', slope_pc));

% Plot reference lines with theoretical slopes
h_min = min(h_values);
h_max = max(h_values);
h_ref_line = logspace(log10(h_min), log10(h_max), 100);

% O(h) reference line
C1 = errors_euler(1) / h_values(1)^slope_euler;
err_O_h = C1 * h_ref_line.^1;
loglog(h_ref_line, err_O_h, '--', 'Color', [0.3 0.3 0.3], 'LineWidth', 1.5, ...
    'DisplayName', 'O(h) reference');

% O(h²) reference line
C2 = errors_pc(1) / h_values(1)^slope_pc;
err_O_h2 = C2 * h_ref_line.^2;
loglog(h_ref_line, err_O_h2, ':', 'Color', [0.3 0.3 0.3], 'LineWidth', 1.5, ...
    'DisplayName', 'O(h²) reference');

% O(h⁴) reference line
C4 = errors_rk4(1) / h_values(1)^slope_rk4;
err_O_h4 = C4 * h_ref_line.^4;
loglog(h_ref_line, err_O_h4, '-.', 'Color', [0.3 0.3 0.3], 'LineWidth', 1.5, ...
    'DisplayName', 'O(h⁴) reference');

xlabel('Step Size h', 'FontSize', 12, 'FontWeight', 'bold');
ylabel('Global Error at Final Time ||S_f - S_ref||', 'FontSize', 12, 'FontWeight', 'bold');
title('Convergence Study: Order of Accuracy Verification', 'FontSize', 13, 'FontWeight', 'bold');
legend('FontSize', 10, 'Location', 'best');
grid on
set(ax1, 'XScale', 'log', 'YScale', 'log');

% Error reduction ratio plot
ax2 = subplot(1, 2, 2);
hold on;

% Compute error ratios between consecutive step sizes
error_ratios_euler = errors_euler(1:end-1) ./ errors_euler(2:end);
error_ratios_rk4 = errors_rk4(1:end-1) ./ errors_rk4(2:end);
error_ratios_pc = errors_pc(1:end-1) ./ errors_pc(2:end);

h_mids = sqrt(h_values(1:end-1) .* h_values(2:end));

semilogy(h_mids, error_ratios_euler, 'o-', 'LineWidth', 2, 'MarkerSize', 8, ...
    'Color', [0.8 0 0], 'DisplayName', 'Euler');
semilogy(h_mids, error_ratios_rk4, 's-', 'LineWidth', 2, 'MarkerSize', 8, ...
    'Color', [0 0.7 0], 'DisplayName', 'RK4');
semilogy(h_mids, error_ratios_pc, '^-', 'LineWidth', 2, 'MarkerSize', 8, ...
    'Color', [0 0 0.8], 'DisplayName', 'Predictor-Corrector');

% Add horizontal reference lines
yline(2, '--', 'Color', [0.3 0.3 0.3], 'LineWidth', 1.5, 'Label', 'O(h) ratio = 2');
yline(4, ':', 'Color', [0.3 0.3 0.3], 'LineWidth', 1.5, 'Label', 'O(h²) ratio = 4');
yline(16, '-.', 'Color', [0.3 0.3 0.3], 'LineWidth', 1.5, 'Label', 'O(h⁴) ratio = 16');

xlabel('Step Size h (geometric mean)', 'FontSize', 12, 'FontWeight', 'bold');
ylabel('Error Reduction Ratio', 'FontSize', 12, 'FontWeight', 'bold');
title('Error Reduction per Half Step', 'FontSize', 13, 'FontWeight', 'bold');
legend('FontSize', 10, 'Location', 'best');
grid on
set(ax2, 'YScale', 'log');

sgtitle('Convergence Analysis: Richardson Extrapolation Framework', ...
    'FontSize', 14, 'FontWeight', 'bold');

end