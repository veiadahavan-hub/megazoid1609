import { describe, it, expect } from 'vitest';

describe('Configuração de Testes', () => {
  it('deve ter Vitest configurado corretamente', () => {
    expect(true).toBe(true);
  });

  it('deve ter acesso ao objeto window', () => {
    expect(window).toBeDefined();
  });

  it('deve ter matchMedia mockado', () => {
    expect(window.matchMedia).toBeDefined();
    const result = window.matchMedia('(max-width: 768px)');
    expect(result).toBeDefined();
    expect(result.matches).toBe(false);
  });

  it('deve ter IntersectionObserver mockado', () => {
    expect(window.IntersectionObserver).toBeDefined();
    const observer = new window.IntersectionObserver(() => {});
    expect(observer).toBeDefined();
    expect(observer.observe).toBeDefined();
  });

  it('deve ter ResizeObserver mockado', () => {
    expect(window.ResizeObserver).toBeDefined();
    const observer = new window.ResizeObserver(() => {});
    expect(observer).toBeDefined();
    expect(observer.observe).toBeDefined();
  });
});
