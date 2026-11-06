import { createContext, ReactNode, useContext, useState } from 'react';

// The custom tab bar floats over the screens (position: absolute), so screens that pin something
// just above it need its real, measured height.
const TabBarHeightContext = createContext<{ height: number; setHeight: (height: number) => void }>({
  height: 0,
  setHeight: () => {},
});

export function TabBarHeightProvider({ children }: { children: ReactNode }) {
  const [height, setHeight] = useState(0);
  return <TabBarHeightContext.Provider value={{ height, setHeight }}>{children}</TabBarHeightContext.Provider>;
}

export const useTabBarHeight = () => useContext(TabBarHeightContext);
