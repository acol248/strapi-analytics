import styled from 'styled-components';

export const StyledPieGraph = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spaces[3]};
  padding: ${({ theme }) => theme.spaces[3]};
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.neutral0};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.shadows.tableShadow};

  & > span {
    font-size: ${({ theme }) => theme.fontSizes[3]};
    margin: ${({ theme }) => theme.spaces[1]} 0 0 ${({ theme }) => theme.spaces[2]};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  & .pie-container {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    min-height: 0;
    width: 100%;
  }
`;
