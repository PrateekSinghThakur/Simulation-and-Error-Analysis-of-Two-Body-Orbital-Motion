function visualize_orbits(t_span, S0, mu, h)
% VISUALIZE_ORBITS Multi-solver trajectory comparison
%
% DESCRIPTION:
%   Plots orbital trajectories from all numerical methods in 2D space.
%   Provides immediate visual assessment of method accuracy and stability.
%
% PHYSICAL INTERPRETATION:
%   - Euler method: spiral pattern indicates energy loss
%   - RK4: nearly perfect circular/elliptical orbit
%   - Predictor-Corrector: intermediate between Euler and RK4
%   - Reference (ode45): gold standard for comparison
%
% INPUT:
%   t_span - Time interval [t0, tf]
%   S0     - Initial condition [x0, y0, vx0, vy0]
%   mu     - Gravitational parameter
%   h      - Step size
%
% AUTHOR: Numerical Methods Course
% DATE: 2024

fprintf('Generating trajectory plots...\n');

% =========================================================================
% RUN ALL SOLVERS
% =========================================================================

[t_euler, S_euler, ~, ~] = manual_solvers('euler', t_span, S0, mu, h);
[t_rk4, S_rk4, ~, ~] = manual_solvers('rk4', t_span, S0, mu, h);
[t_pc, S_pc, ~, ~] = manual_solvers('pc', t_span, S0, mu, h);
[t_ref, S_ref, ~, ~] = manual_solvers('ode45', t_span, S0, mu, 0.005);

% =========================================================================
% FIGURE 1: ALL METHODS ON SINGLE PLOT
% =========================================================================

figure('Name', 'Orbit Comparison', 'NumberTitle', 'off');
set(gcf, 'Position', [100, 100, 900, 900]);

% Main orbit plot
ax = gca;
hold on;
grid on;

% Plot orbits
plot(S_euler(:,1), S_euler(:,2), 'r-', 'LineWidth', 2, 'DisplayName', 'Euler');
plot(S_rk4(:,1), S_rk4(:,2), 'g-', 'LineWidth', 2, 'DisplayName', 'RK4');
plot(S_pc(:,1), S_pc(:,2), 'b-', 'LineWidth', 2, 'DisplayName', 'Predictor-Corrector');
plot(S_ref(:,1), S_ref(:,2), 'k--', 'LineWidth', 1.5, 'DisplayName', 'Reference (ode45)');

% Mark special points
plot(0, 0, 'ko', 'MarkerSize', 12, 'LineWidth', 2, 'DisplayName', 'Central Body');
plot(S0(1), S0(2), 'r*', 'MarkerSize', 15, 'DisplayName', 'Initial Position');
plot(S_euler(end,1), S_euler(end,2), 'rs', 'MarkerSize', 10, 'DisplayName', 'Euler Final');
plot(S_rk4(end,1), S_rk4(end,2), 'gs', 'MarkerSize', 10, 'DisplayName', 'RK4 Final');
plot(S_pc(end,1), S_pc(end,2), 'bs', 'MarkerSize', 10, 'DisplayName', 'PC Final');
plot(S_ref(end,1), S_ref(end,2), 'ks', 'MarkerSize', 8, 'DisplayName', 'Ref Final');

xlabel('x (AU)', 'FontSize', 12, 'FontWeight', 'bold');
ylabel('y (AU)', 'FontSize', 12, 'FontWeight', 'bold');
title(sprintf('Orbital Trajectories (h = %.4f)', h), 'FontSize', 13, 'FontWeight', 'bold');
legend('FontSize', 10, 'Location', 'best');
axis equal;
axis tight;

% =========================================================================
% FIGURE 2: INDIVIDUAL METHOD ORBITS (Subplots)
% =========================================================================

figure('Name', 'Individual Orbits', 'NumberTitle', 'off');
set(gcf, 'Position', [100, 100, 1200, 1000]);

methods = {'Euler', 'RK4', 'Predictor-Corrector', 'Reference'};
solutions = {S_euler, S_rk4, S_pc, S_ref};
times = {t_euler, t_rk4, t_pc, t_ref};
colors = {'r', 'g', 'b', 'k'};

for i = 1:4
    ax = subplot(2, 2, i);
    hold on;
    grid on;
    
    % Orbit
    plot(solutions{i}(:,1), solutions{i}(:,2), [colors{i} '-'], 'LineWidth', 2);
    
    % Central body
    plot(0, 0, 'ko', 'MarkerSize', 10, 'LineWidth', 2);
    
    % Initial and final positions
    plot(solutions{i}(1,1), solutions{i}(1,2), 'g*', 'MarkerSize', 12, ...
        'DisplayName', 'Start');
    plot(solutions{i}(end,1), solutions{i}(end,2), 'rs', 'MarkerSize', 8, ...
        'DisplayName', 'End');
    
    % Compute orbital parameters
    r_init = sqrt(solutions{i}(1,1)^2 + solutions{i}(1,2)^2);
    r_final = sqrt(solutions{i}(end,1)^2 + solutions{i}(end,2)^2);
    
    xlabel('x (AU)', 'FontSize', 10);
    ylabel('y (AU)', 'FontSize', 10);
    title(sprintf('%s (r: %.4f → %.4f)', methods{i}, r_init, r_final), ...
        'FontSize', 11, 'FontWeight', 'bold');
    axis equal;
    axis tight;
    legend('FontSize', 9);
end

sgtitle(sprintf('Individual Orbital Trajectories (h = %.4f)', h), ...
    'FontSize', 13, 'FontWeight', 'bold');

% =========================================================================
% FIGURE 3: DISTANCE FROM ORIGIN (Orbital Parameter Evolution)
% =========================================================================

figure('Name', 'Orbital Radius Evolution', 'NumberTitle', 'off');
set(gcf, 'Position', [1100, 100, 900, 500]);

% Compute distances
r_euler = sqrt(S_euler(:,1).^2 + S_euler(:,2).^2);
r_rk4 = sqrt(S_rk4(:,1).^2 + S_rk4(:,2).^2);
r_pc = sqrt(S_pc(:,1).^2 + S_pc(:,2).^2);
r_ref = sqrt(S_ref(:,1).^2 + S_ref(:,2).^2);

hold on;
plot(t_euler, r_euler, 'r-', 'LineWidth', 1.5, 'DisplayName', 'Euler');
plot(t_rk4, r_rk4, 'g-', 'LineWidth', 1.5, 'DisplayName', 'RK4');
plot(t_pc, r_pc, 'b-', 'LineWidth', 1.5, 'DisplayName', 'Predictor-Corrector');
plot(t_ref, r_ref, 'k--', 'LineWidth', 1, 'DisplayName', 'Reference (ode45)');

xlabel('Time', 'FontSize', 12);
ylabel('Distance from Origin r(t)', 'FontSize', 12);
title('Orbital Radius Evolution', 'FontSize', 13, 'FontWeight', 'bold');
legend('FontSize', 10);
grid on;

% Print statistics
fprintf('\nOrbital Statistics (h = %.4f):\n', h);
fprintf('  Initial radius: %.4f\n', r_euler(1));
fprintf('  Final radius:\n');
fprintf('    Euler:               %.4f (Δr = %+.4e)\n', r_euler(end), r_euler(end) - r_euler(1));
fprintf('    RK4:                 %.4f (Δr = %+.4e)\n', r_rk4(end), r_rk4(end) - r_rk4(1));
fprintf('    Predictor-Corrector: %.4f (Δr = %+.4e)\n', r_pc(end), r_pc(end) - r_pc(1));
fprintf('    Reference:          %.4f (Δr = %+.4e)\n', r_ref(end), r_ref(end) - r_ref(1));

end

% =========================================================================
% END OF visualize_orbits.m
% =========================================================================