import { Component, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Server } from '@shared/models';
import { ServerAPI } from 'src/app/core/services/server-api';
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

@Component({
  selector: 'app-server-list',
  imports: [RouterLink, ReactiveFormsModule, FaIconComponent],
  templateUrl: './server-list.html',
  styleUrl: './server-list.css',
})
export class ServerList implements OnInit {
  private readonly serverAPI = inject(ServerAPI);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);

  protected servers = signal<Server[]>([]);

  private readonly createServerModalRef = viewChild<ElementRef<HTMLDialogElement>>('createServerModal');
  private readonly joinServerModalRef = viewChild<ElementRef<HTMLDialogElement>>('joinServerModal');

  protected createServerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
  });

  protected joinServerForm = this.fb.group({
    inviteCode: ['', [Validators.required]],
  });

  protected isCreatingServer = false;
  protected isJoiningServer = false;
  protected showErrorToast = false;
  protected toastMessage = '';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.serverAPI.getServerList().subscribe((servers) => {
      this.servers.set(servers)
    });
  }

  protected openCreateServerModal(): void {
    this.createServerForm.reset({ name: '' });
    this.createServerModalRef()?.nativeElement.showModal();
  }

  protected openJoinServerModal(): void {
    this.joinServerForm.reset({ inviteCode: '' });
    this.joinServerModalRef()?.nativeElement.showModal();
  }

  protected onCreateServer(): void {
    if (this.createServerForm.invalid || this.isCreatingServer) {
      this.createServerForm.markAllAsTouched();
      return;
    }

    const { name } = this.createServerForm.getRawValue();
    this.isCreatingServer = true;

    this.serverAPI.createServer(name).subscribe({
      next: (newServer) => {
        this.isCreatingServer = false;
        this.servers.update((prev) => [...prev, newServer]);
        this.createServerModalRef()?.nativeElement.close();
        this.router.navigate(['/dashboard', newServer.id]);
      },
      error: (error) => {
        this.isCreatingServer = false;
        const message = error?.error?.message || 'Failed to create server';
        this.showToast(message);
      },
    });
  }

  protected onJoinServer(): void {
    if (this.joinServerForm.invalid || this.isJoiningServer) {
      this.joinServerForm.markAllAsTouched();
      return;
    }

    const { inviteCode } = this.joinServerForm.getRawValue();
    this.isJoiningServer = true;

    this.serverAPI.joinServer(inviteCode).subscribe({
      next: (newServer) => {
        this.isJoiningServer = false;
        // Verify we aren't already rendering this server to avoid duplicates
        if (!this.servers().find(s => s.id === newServer.id)) {
          this.servers.update((prev) => [...prev, newServer]);
        }
        this.joinServerModalRef()?.nativeElement.close();
        this.router.navigate(['/dashboard', newServer.id]);
      },
      error: (error) => {
        this.isJoiningServer = false;
        const message = error?.error?.message || 'Failed to join server';
        this.showToast(message);
      },
    });
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    this.showErrorToast = true;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.showErrorToast = false;
      this.toastMessage = '';
      this.toastTimer = null;
    }, 3000);
  }
}
