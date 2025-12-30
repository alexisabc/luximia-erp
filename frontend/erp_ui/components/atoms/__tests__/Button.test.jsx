/**
 * Tests para el componente Button (Atom)
 * 
 * Verifica que el componente se renderiza correctamente con diferentes props
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '../Button';
import { Save } from 'lucide-react';

describe('Button Component', () => {
    describe('Rendering', () => {
        it('renders without crashing', () => {
            render(<Button>Click me</Button>);
            expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
        });

        it('renders children correctly', () => {
            render(<Button>Test Button</Button>);
            expect(screen.getByText('Test Button')).toBeInTheDocument();
        });

        it('applies custom className', () => {
            render(<Button className="custom-class">Button</Button>);
            const button = screen.getByRole('button');
            expect(button).toHaveClass('custom-class');
        });
    });

    describe('Variants', () => {
        it('renders primary variant by default', () => {
            render(<Button>Primary</Button>);
            const button = screen.getByRole('button');
            expect(button).toHaveClass('bg-primary');
        });

        it('renders secondary variant', () => {
            render(<Button variant="secondary">Secondary</Button>);
            const button = screen.getByRole('button');
            expect(button).toHaveClass('bg-secondary');
        });

        it('renders outline variant', () => {
            render(<Button variant="outline">Outline</Button>);
            const button = screen.getByRole('button');
            expect(button).toHaveClass('border-2');
        });

        it('renders ghost variant', () => {
            render(<Button variant="ghost">Ghost</Button>);
            const button = screen.getByRole('button');
            expect(button).toHaveClass('bg-transparent');
        });

        it('renders destructive variant', () => {
            render(<Button variant="destructive">Delete</Button>);
            const button = screen.getByRole('button');
            expect(button).toHaveClass('bg-destructive');
        });
    });

    describe('Sizes', () => {
        it('renders medium size by default', () => {
            render(<Button>Medium</Button>);
            const button = screen.getByRole('button');
            expect(button).toHaveClass('h-11');
        });

        it('renders small size', () => {
            render(<Button size="sm">Small</Button>);
            const button = screen.getByRole('button');
            expect(button).toHaveClass('h-10');
        });

        it('renders large size', () => {
            render(<Button size="lg">Large</Button>);
            const button = screen.getByRole('button');
            expect(button).toHaveClass('h-12');
        });

        it('renders extra large size', () => {
            render(<Button size="xl">Extra Large</Button>);
            const button = screen.getByRole('button');
            expect(button).toHaveClass('h-14');
        });
    });

    describe('States', () => {
        it('is disabled when disabled prop is true', () => {
            render(<Button disabled>Disabled</Button>);
            const button = screen.getByRole('button');
            expect(button).toBeDisabled();
        });

        it('shows loading spinner when loading', () => {
            render(<Button loading>Loading</Button>);
            const button = screen.getByRole('button');
            expect(button).toBeDisabled();
            // Loader2 component renders an svg
            expect(button.querySelector('svg')).toBeInTheDocument();
        });

        it('is disabled when loading', () => {
            render(<Button loading>Loading</Button>);
            expect(screen.getByRole('button')).toBeDisabled();
        });
    });

    describe('Full Width', () => {
        it('renders full width when fullWidth prop is true', () => {
            render(<Button fullWidth>Full Width</Button>);
            const button = screen.getByRole('button');
            expect(button).toHaveClass('w-full');
        });

        it('does not render full width by default', () => {
            render(<Button>Normal Width</Button>);
            const button = screen.getByRole('button');
            expect(button).not.toHaveClass('w-full');
        });
    });

    describe('Icons', () => {
        it('renders icon on the left by default', () => {
            render(<Button icon={Save}>Save</Button>);
            const button = screen.getByRole('button');
            const svg = button.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });

        it('renders icon on the right when iconPosition is right', () => {
            render(<Button icon={Save} iconPosition="right">Save</Button>);
            const button = screen.getByRole('button');
            const svg = button.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });

        it('does not render icon when loading', () => {
            render(<Button icon={Save} loading>Loading</Button>);
            const button = screen.getByRole('button');
            // Should only have the loading spinner, not the icon
            const svgs = button.querySelectorAll('svg');
            expect(svgs).toHaveLength(1); // Only the Loader2 spinner
        });
    });

    describe('Interactions', () => {
        it('calls onClick handler when clicked', () => {
            const handleClick = jest.fn();
            render(<Button onClick={handleClick}>Click me</Button>);

            const button = screen.getByRole('button');
            fireEvent.click(button);

            expect(handleClick).toHaveBeenCalledTimes(1);
        });

        it('does not call onClick when disabled', () => {
            const handleClick = jest.fn();
            render(<Button onClick={handleClick} disabled>Disabled</Button>);

            const button = screen.getByRole('button');
            fireEvent.click(button);

            expect(handleClick).not.toHaveBeenCalled();
        });

        it('does not call onClick when loading', () => {
            const handleClick = jest.fn();
            render(<Button onClick={handleClick} loading>Loading</Button>);

            const button = screen.getByRole('button');
            fireEvent.click(button);

            expect(handleClick).not.toHaveBeenCalled();
        });
    });

    describe('Accessibility', () => {
        it('has button role', () => {
            render(<Button>Accessible</Button>);
            expect(screen.getByRole('button')).toBeInTheDocument();
        });

        it('forwards ref correctly', () => {
            const ref = React.createRef();
            render(<Button ref={ref}>Ref Button</Button>);
            expect(ref.current).toBeInstanceOf(HTMLButtonElement);
        });

        it('passes through additional props', () => {
            render(<Button type="submit" data-testid="submit-btn">Submit</Button>);
            const button = screen.getByTestId('submit-btn');
            expect(button).toHaveAttribute('type', 'submit');
        });
    });
});
