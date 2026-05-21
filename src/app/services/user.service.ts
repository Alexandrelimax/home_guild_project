import { Injectable, signal, computed } from '@angular/core';
import { User } from '../interfaces/interface';

@Injectable({ providedIn: 'root' })
export class UserService {
  // Mantemos o signal privado para controle total da classe
  private readonly _user = signal<User | null>(null);
  private readonly _loading = signal(false);

  // Exposição reativa (ReadOnly)
  readonly user = computed(() => this._user());
  readonly loading = computed(() => this._loading());

  // Helpers de XP e Level para a UI
  readonly currentLevel = computed(() => this._user()?.level || 1);
  readonly currentBits = computed(() => this._user()?.bits || 0);

  setUser(user: User) {
    this._user.set(user);
  }

  /**
   * Atualiza apenas partes do usuário (ex: após ganhar XP ou gastar BITS)
   * sem precisar recarregar o objeto inteiro do servidor.
   */
  patchUser(changes: Partial<User>) {
    const current = this._user();
    if (current) {
      this._user.set({ ...current, ...changes });
    }
  }

  getCurrentUserId(): number {
    const id = this._user()?.id;
    if (!id) throw new Error('Jogador não autenticado ou não carregado.');
    return id;
  }

  clear() {
    this._user.set(null);
  }

  setLoading(loading: boolean) {
    this._loading.set(loading);
  }
}