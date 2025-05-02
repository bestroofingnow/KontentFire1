import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AnimationControls() {
  const form = useFormContext();
  const includeImages = form.watch("includeImages");
  const animateImages = form.watch("animateImages");

  if (!includeImages) {
    return null;
  }

  return (
    <>
      <FormField
        control={form.control}
        name="animateImages"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Animate Images</FormLabel>
              <FormDescription>
                Use AnimateDiff to create animated content from generated images
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      {animateImages && (
        <FormField
          control={form.control}
          name="animationStyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Animation Style</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select animation style" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="pan">Pan</SelectItem>
                  <SelectItem value="rotate">Rotate</SelectItem>
                  <SelectItem value="bounce">Bounce</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Select the animation style to apply to generated images
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}