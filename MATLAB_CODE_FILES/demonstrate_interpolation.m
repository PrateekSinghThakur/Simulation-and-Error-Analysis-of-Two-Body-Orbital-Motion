function demonstrate_interpolation()
% DEMONSTRATE_INTERPOLATION Lagrange interpolation with orbit data

fprintf('\n=== MODULE 4: LAGRANGE POLYNOMIAL INTERPOLATION ===\n');

% =========================================================================
% STEP 1: GENERATE DENSE REFERENCE SOLUTION
% =========================================================================

fprintf('Generating reference solution with RK4 (h=0.01)...\n');

t_span = [0, 10];
S0 = [1, 0, 0, 1];  % Circular orbit
mu = 1.0;

[t_dense, S_dense, E_dense, L_dense] = manual_solvers('rk4', t_span, S0, mu, 0.01);

fprintf('  %d solution points generated\n', length(t_dense));

% =========================================================================
% STEP 2: SELECT SPARSE INTERPOLATION NODES
% =========================================================================

skip = 20;
t_nodes = t_dense(1:skip:end);
S_nodes = S_dense(1:skip:end, :);
E_nodes = E_dense(1:skip:end);
L_nodes = L_dense(1:skip:end);

fprintf('Sparse node set: %d points (decimation factor = %d)\n', ...
    length(t_nodes), skip);

% =========================================================================
% STEP 3: LAGRANGE INTERPOLATION
% =========================================================================

fprintf('Performing Lagrange polynomial interpolation...\n');

[t_interp, S_interp] = lagrange_interp(t_nodes, S_nodes, t_dense);

% For energy and angular momentum, use interp1 since they're scalars
E_interp = interp1(t_nodes, E_nodes, t_dense, 'pchip');
L_interp = interp1(t_nodes, L_nodes, t_dense, 'pchip');

% Ensure column vectors
if size(E_interp, 2) > size(E_interp, 1)
    E_interp = E_interp';
end
if size(L_interp, 2) > size(L_interp, 1)
    L_interp = L_interp';
end

% =========================================================================
% STEP 4: ERROR ANALYSIS
% =========================================================================

error_x = abs(S_dense(:,1) - S_interp(:,1));
error_y = abs(S_dense(:,2) - S_interp(:,2));
error_vx = abs(S_dense(:,3) - S_interp(:,3));
error_vy = abs(S_dense(:,4) - S_interp(:,4));

error_state = sqrt(error_x.^2 + error_y.^2 + error_vx.^2 + error_vy.^2);

max_error_pos = max(sqrt((S_dense(:,1) - S_interp(:,1)).^2 + ...
                         (S_dense(:,2) - S_interp(:,2)).^2));
max_error_vel = max(sqrt((S_dense(:,3) - S_interp(:,3)).^2 + ...
                         (S_dense(:,4) - S_interp(:,4)).^2));

fprintf('\nInterpolation Accuracy:\n');
fprintf('  Max position error: %.4e\n', max_error_pos);
fprintf('  Max velocity error: %.4e\n', max_error_vel);
fprintf('  RMS state error:    %.4e\n', sqrt(mean(error_state.^2)));

% =========================================================================
% FIGURE: LAGRANGE INTERPOLATION RESULTS (3 subplots)
% =========================================================================

figure('Name', 'Module 4: Lagrange Interpolation', 'NumberTitle', 'off');
set(gcf, 'Position', [100, 100, 1400, 900]);

% Trajectory plot
ax1 = subplot(2, 3, 1);
hold on;
grid on;

plot(S_dense(:,1), S_dense(:,2), 'b-', 'LineWidth', 2, 'DisplayName', 'RK4 (dense, h=0.01)');
plot(S_nodes(:,1), S_nodes(:,2), 'ko', 'MarkerSize', 8, 'DisplayName', sprintf('Interpolation nodes (%d)', length(t_nodes)));
plot(S_interp(:,1), S_interp(:,2), 'r--', 'LineWidth', 1.5, 'DisplayName', 'Lagrange interpolation');
plot(0, 0, 'k*', 'MarkerSize', 15, 'DisplayName', 'Central body');

xlabel('x (AU)', 'FontSize', 11);
ylabel('y (AU)', 'FontSize', 11);
title('Orbit Reconstruction via Polynomial Interpolation', 'FontSize', 12, 'FontWeight', 'bold');
legend('FontSize', 9);
axis equal;
axis tight;

% Position error vs time
ax2 = subplot(2, 3, 2);
semilogy(t_dense, sqrt(error_x.^2 + error_y.^2), 'b-', 'LineWidth', 1.5, 'DisplayName', 'Position error');
hold on;
semilogy(t_dense, sqrt(error_vx.^2 + error_vy.^2), 'r-', 'LineWidth', 1.5, 'DisplayName', 'Velocity error');

xlabel('Time', 'FontSize', 11);
ylabel('Absolute Error', 'FontSize', 11);
title('Interpolation Error Components', 'FontSize', 12, 'FontWeight', 'bold');
legend('FontSize', 9);
grid on

% Overall state error
ax3 = subplot(2, 3, 3);
hold on;

% Mark interpolation intervals
for i = 1:length(t_nodes)-1
    xline(t_nodes(i), 'k--', 'Alpha', 0.3);
end

semilogy(t_dense, error_state, 'b-', 'LineWidth', 2, 'DisplayName', 'Overall state error');
hold on;
semilogy(t_nodes, error_state(ismember(round(t_dense*1e6)/1e6, round(t_nodes*1e6)/1e6)), ...
    'ro', 'MarkerSize', 8, 'DisplayName', 'Error at nodes (≈zero)');

xlabel('Time', 'FontSize', 11);
ylabel('Total State Error ||ΔS||', 'FontSize', 11);
title('Error Distribution in Time', 'FontSize', 12, 'FontWeight', 'bold');
legend('FontSize', 9);
grid on

% =========================================================================
% Lagrange basis visualization
% =========================================================================

% Use first few nodes for visualization
n_vis = min(5, length(t_nodes));
t_nodes_vis = t_nodes(1:n_vis);

% Create fine grid in first interval
t_interval = linspace(t_nodes_vis(1), t_nodes_vis(n_vis), 200);

% Compute and plot each basis function
ax4 = subplot(2, 3, 4);
colors_basis = lines(n_vis);
hold on;
grid on;

for i = 1:n_vis
    L_i = zeros(length(t_interval), 1);
    
    for k = 1:length(t_interval)
        t = t_interval(k);
        L = 1.0;
        
        for j = 1:n_vis
            if i ~= j
                L = L * (t - t_nodes_vis(j)) / (t_nodes_vis(i) - t_nodes_vis(j));
            end
        end
        
        L_i(k) = L;
    end
    
    plot(t_interval, L_i, 'Color', colors_basis(i,:), 'LineWidth', 2, ...
        'DisplayName', sprintf('L_{%d}(t)', i-1));
end

% Mark nodes
for i = 1:n_vis
    plot(t_nodes_vis(i), 1, 'ko', 'MarkerSize', 8);
end

xlabel('Time', 'FontSize', 11);
ylabel('L_i(t)', 'FontSize', 11);
title(sprintf('Lagrange Basis Polynomials (First %d nodes)', n_vis), 'FontSize', 12, 'FontWeight', 'bold');
legend('FontSize', 8, 'Location', 'best');
ylim([-0.3 1.2]);
grid on

% =========================================================================
% Energy interpolation
% =========================================================================

ax5 = subplot(2, 3, 5);
plot(t_dense, E_dense, 'b-', 'LineWidth', 1.5, 'DisplayName', 'RK4 (dense)');
hold on;
plot(t_nodes, E_nodes, 'ko', 'MarkerSize', 6, 'DisplayName', 'Nodes');
plot(t_dense, E_interp, 'r--', 'LineWidth', 1, 'DisplayName', 'Interpolated');

xlabel('Time', 'FontSize', 11);
ylabel('Energy E', 'FontSize', 11);
title('Energy Interpolation', 'FontSize', 12, 'FontWeight', 'bold');
legend('FontSize', 9);
grid on

% =========================================================================
% Angular momentum interpolation
% =========================================================================

ax6 = subplot(2, 3, 6);
plot(t_dense, L_dense, 'b-', 'LineWidth', 1.5, 'DisplayName', 'RK4 (dense)');
hold on;
plot(t_nodes, L_nodes, 'ko', 'MarkerSize', 6, 'DisplayName', 'Nodes');
plot(t_dense, L_interp, 'r--', 'LineWidth', 1, 'DisplayName', 'Interpolated');

xlabel('Time', 'FontSize', 11);
ylabel('Angular Momentum |L|', 'FontSize', 11);
title('Angular Momentum Interpolation', 'FontSize', 12, 'FontWeight', 'bold');
legend('FontSize', 9);
grid on

sgtitle(sprintf('Lagrange Interpolation (degree %d, %d nodes)', length(t_nodes)-1, length(t_nodes)), ...
    'FontSize', 14, 'FontWeight', 'bold');

% =========================================================================
% PRINT MATHEMATICAL PROPERTIES
% =========================================================================

fprintf('\nLagrange Interpolation Properties:\n');
fprintf('  Polynomial degree: %d\n', length(t_nodes) - 1);
fprintf('  Number of basis functions: %d\n', length(t_nodes));
fprintf('  Interpolation nodes: [%.4f, ..., %.4f]\n', t_nodes(1), t_nodes(end));

fprintf('\nMathematical Verification:\n');

% Verify L_i(t_j) = δ_ij at node locations
fprintf('  Checking exact reproduction at nodes...\n');
for i = 1:min(3, length(t_nodes))
    [~, S_check] = lagrange_interp(t_nodes, S_nodes, t_nodes(i));
    error_at_node = norm(S_check - S_nodes(i,:));
    fprintf('    Node %d: ||S_interp - S_data|| = %.4e\n', i, error_at_node);
end

fprintf('\nConclusion:\n');
fprintf('  ✓ Lagrange interpolation exactly reproduces solution at nodes\n');
fprintf('  ✓ Provides smooth polynomial approximation between nodes\n');
fprintf('  ✓ Useful for data compression: %d → %d points (%.1f%% reduction)\n', ...
    length(t_dense), length(t_nodes), 100*(1 - length(t_nodes)/length(t_dense)));

end