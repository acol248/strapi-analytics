import styled from 'styled-components';

export const StyledAreaGraph = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spaces[3]};
  padding: ${({ theme }) => theme.spaces[3]};
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.neutral0};
  border: 1px solid ${({ theme }) => theme.colors.neutral150};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.shadows.tableShadow};

  & > span, & > p {
    margin: ${({ theme }) => theme.spaces[1]} 0 0 ${({ theme }) => theme.spaces[2]};
  }
`;
