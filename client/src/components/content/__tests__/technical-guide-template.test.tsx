/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import TechnicalGuideTemplate from '../technical-guide-template';
import { TechnicalGuideData } from '@/types/templates';

// Mock functions
const mockOnChange = jest.fn();
const mockOnGenerateContent = jest.fn();

describe('TechnicalGuideTemplate', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockOnChange.mockReset();
    mockOnGenerateContent.mockReset();
  });

  it('renders the component with default props', () => {
    const formData: TechnicalGuideData = {};
    
    render(
      <TechnicalGuideTemplate 
        formData={formData} 
        onChange={mockOnChange}
      />
    );
    
    // Check if the component renders correctly
    expect(screen.getByText('Technical Guide Template')).toBeInTheDocument();
    expect(screen.getByLabelText('Topic')).toBeInTheDocument();
    expect(screen.getByLabelText('Target Audience Level')).toBeInTheDocument();
  });

  it('updates form data when inputs change', () => {
    const formData: TechnicalGuideData = {};
    
    render(
      <TechnicalGuideTemplate 
        formData={formData} 
        onChange={mockOnChange}
      />
    );
    
    // Simulate input change
    const topicInput = screen.getByLabelText('Topic');
    fireEvent.change(topicInput, { target: { value: 'Docker Containerization' } });
    
    // Check if onChange was called with updated form data
    expect(mockOnChange).toHaveBeenCalledWith({
      topic: 'Docker Containerization'
    });
  });

  it('allows adding and removing prerequisites', () => {
    const formData: TechnicalGuideData = {
      prerequisites: ['Basic Linux knowledge']
    };
    
    render(
      <TechnicalGuideTemplate 
        formData={formData} 
        onChange={mockOnChange}
      />
    );
    
    // Check if the existing prerequisite is displayed
    expect(screen.getByDisplayValue('Basic Linux knowledge')).toBeInTheDocument();
    
    // Add a new prerequisite
    const newPrereqInput = screen.getByPlaceholderText('Add a new prerequisite');
    fireEvent.change(newPrereqInput, { target: { value: 'Git basics' } });
    expect(mockOnChange).toHaveBeenCalledWith({
      ...formData,
      newPrerequisite: 'Git basics'
    });
    
    // Click the add button
    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);
    
    // Verify the onChange call includes the new prerequisite
    expect(mockOnChange).toHaveBeenCalledWith({
      ...formData,
      prerequisites: [...formData.prerequisites, 'Git basics'],
      newPrerequisite: ''
    });
  });

  it('calls onGenerateContent when generate button is clicked', () => {
    const formData: TechnicalGuideData = {
      topic: 'Docker Containerization',
      audience: 'beginner'
    };
    
    render(
      <TechnicalGuideTemplate 
        formData={formData} 
        onChange={mockOnChange}
        onGenerateContent={mockOnGenerateContent}
      />
    );
    
    // Find and click the generate button
    const generateButton = screen.getByRole('button', { name: /generate technical guide content/i });
    fireEvent.click(generateButton);
    
    // Check if onGenerateContent was called with the form data
    expect(mockOnGenerateContent).toHaveBeenCalledWith(formData);
  });
});