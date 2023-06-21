import { PropsWithChildren } from "react";

export const ControlHeading = ({ children }: PropsWithChildren) => (
  <h2 className="text-lg my-2">{children}</h2>
);
