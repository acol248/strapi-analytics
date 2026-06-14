import styled from 'styled-components';

export const StyledAreaGraph = styled.div`
  padding: ${({ theme }) => theme.spaces[3]};
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.neutral0};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.shadows.tableShadow};
`;
