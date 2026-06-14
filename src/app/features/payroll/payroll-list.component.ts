import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DecimalPipe } from '@angular/common';
import { PayrollService } from '../../core/services/payroll.service';
import { Payroll } from '../../core/models/payroll.model';

@Component({
  selector: 'app-payroll-list',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatChipsModule, MatTooltipModule, MatSnackBarModule,
    MatProgressSpinnerModule, DecimalPipe
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Gestion de la Paie</h1>
    </div>

    <mat-card>
      <mat-card-content>
        @if (loading()) {
          <div class="spinner-center"><mat-spinner diameter="40" /></div>
        } @else {
          <table mat-table [dataSource]="payrolls()" class="full-table">
            <ng-container matColumnDef="employee">
              <th mat-header-cell *matHeaderCellDef>Employé</th>
              <td mat-cell *matCellDef="let p">{{ p.employeeName }}</td>
            </ng-container>
            <ng-container matColumnDef="period">
              <th mat-header-cell *matHeaderCellDef>Période</th>
              <td mat-cell *matCellDef="let p">{{ monthLabel(p.month) }} {{ p.year }}</td>
            </ng-container>
            <ng-container matColumnDef="baseSalary">
              <th mat-header-cell *matHeaderCellDef>Salaire de base</th>
              <td mat-cell *matCellDef="let p">{{ p.baseSalary | number:'1.2-2' }} MAD</td>
            </ng-container>
            <ng-container matColumnDef="bonuses">
              <th mat-header-cell *matHeaderCellDef>Primes</th>
              <td mat-cell *matCellDef="let p">{{ p.bonuses | number:'1.2-2' }} MAD</td>
            </ng-container>
            <ng-container matColumnDef="deductions">
              <th mat-header-cell *matHeaderCellDef>Déductions</th>
              <td mat-cell *matCellDef="let p">{{ p.deductions | number:'1.2-2' }} MAD</td>
            </ng-container>
            <ng-container matColumnDef="netSalary">
              <th mat-header-cell *matHeaderCellDef>Net</th>
              <td mat-cell *matCellDef="let p"><strong>{{ p.netSalary | number:'1.2-2' }} MAD</strong></td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let p">
                <mat-chip [color]="statusColor(p.status)" highlighted>{{ statusLabel(p.status) }}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let p">
                @if (p.status === 'DRAFT') {
                  <button mat-icon-button (click)="process(p)" matTooltip="Traiter" color="primary">
                    <mat-icon>play_arrow</mat-icon>
                  </button>
                }
                @if (p.status === 'PROCESSED') {
                  <button mat-icon-button (click)="markPaid(p)" matTooltip="Marquer payé" color="accent">
                    <mat-icon>payments</mat-icon>
                  </button>
                }
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          @if (payrolls().length === 0) {
            <div class="empty-state"><mat-icon>receipt_long</mat-icon><p>Aucune fiche de paie</p></div>
          }
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title { margin: 0; font-size: 24px; font-weight: 600; }
    .full-table { width: 100%; }
    .spinner-center { display: flex; justify-content: center; padding: 40px; }
    .empty-state { text-align: center; padding: 40px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `]
})
export class PayrollListComponent implements OnInit {
  private payrollService = inject(PayrollService);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['employee', 'period', 'baseSalary', 'bonuses', 'deductions', 'netSalary', 'status', 'actions'];
  payrolls = signal<Payroll[]>([]);
  loading = signal(true);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.payrollService.getAll().subscribe({
      next: data => { this.payrolls.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  monthLabel(m: number): string {
    return ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][m - 1] ?? '';
  }

  statusLabel(s: string): string {
    return { DRAFT: 'Brouillon', PROCESSED: 'Traité', PAID: 'Payé' }[s] ?? s;
  }

  statusColor(s: string): string {
    return { DRAFT: '', PROCESSED: 'accent', PAID: 'primary' }[s] ?? '';
  }

  process(p: Payroll): void {
    this.payrollService.process(p.id!).subscribe({
      next: () => { this.snackBar.open('Fiche traitée', 'OK', { duration: 3000 }); this.load(); }
    });
  }

  markPaid(p: Payroll): void {
    this.payrollService.markAsPaid(p.id!).subscribe({
      next: () => { this.snackBar.open('Marquée comme payée', 'OK', { duration: 3000 }); this.load(); }
    });
  }
}
