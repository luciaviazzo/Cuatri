import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App.tsx';

describe('App', () => {
  it('monta sin errores y muestra el título', () => {
    render(<App />);
    expect(screen.getByText('Cuatri')).toBeInTheDocument();
  });
});
