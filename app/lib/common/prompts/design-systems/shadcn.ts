import type { DesignSystemDefinition } from './types';

export const shadcnDesignSystem: DesignSystemDefinition = {
  id: 'shadcn',
  name: 'shadcn/ui',
  description: 'Re-usable components built with Radix UI and Tailwind CSS',
  promptFragment: `You are using shadcn/ui components. Key principles:
- Components use the "cn" utility for className merging
- Use "asChild" prop from Radix when wrapping component children
- Import from "@/components/ui/component-name"
- Style variants use cva() from class-variance-authority`,
  components: [
    {
      name: 'Button',
      description: 'Button with variants (default, destructive, outline, secondary, ghost, link)',
      api: '<Button variant="default" size="default">',
    },
    {
      name: 'Card',
      description: 'Card with Header, Content, Footer, Title, Description',
      api: '<Card><CardHeader><CardTitle></CardTitle></CardHeader><CardContent></CardContent></Card>',
    },
    {
      name: 'Dialog',
      description: 'Modal dialog with Trigger, Content, Header, Footer',
      api: '<Dialog><DialogTrigger></DialogTrigger><DialogContent></DialogContent></Dialog>',
    },
    { name: 'Input', description: 'Form input with label support', api: '<Input type="text" placeholder="" />' },
    {
      name: 'Select',
      description: 'Select dropdown with Trigger, Value, Content, Item',
      api: '<Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="">Item</SelectItem></SelectContent></Select>',
    },
    {
      name: 'Tabs',
      description: 'Tabbed interface with List, Trigger, Content',
      api: '<Tabs><TabsList><TabsTrigger value="tab">Tab</TabsTrigger></TabsList><TabsContent value="tab"></TabsContent></Tabs>',
    },
    {
      name: 'Badge',
      description: 'Badge with variants (default, secondary, destructive, outline)',
      api: '<Badge variant="default">Label</Badge>',
    },
    {
      name: 'Toast',
      description: 'Toast notification using sonner library',
      api: 'toast("Message") or toast.success("Success")',
    },
  ],
};
