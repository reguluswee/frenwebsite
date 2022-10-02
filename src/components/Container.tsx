import { clsx } from "clsx";

const Container = ({ className, ...props }: any) => {
  return (
    <div
      className={clsx("mx-auto max-w-xl pt-12 px-4 sm:px-6 lg:px-8", className)}
      {...props}
    />
  );
};

export default Container;