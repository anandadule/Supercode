import type { DesignSystemDefinition } from './types';

export const materialUIDesignSystem: DesignSystemDefinition = {
  id: 'material-ui',
  name: 'Material UI',
  description: "Google's Material Design system with React components",
  promptFragment: `You are using Material UI (MUI) components. Key principles:
- Use the "sx" prop for custom styling instead of className
- Theme customization goes through createTheme() and ThemeProvider
- Import components from "@mui/material/" path
- Use makeStyles or styled() for reusable custom styles
- Follow Material Design guidelines for spacing, elevation, and layouts
- Grid uses 12-column layout with xs, sm, md, lg, xl breakpoints
- Use the "component" prop to change the underlying HTML element of a component`,
  components: [
    {
      name: 'Button',
      description: 'Button with variants (text, contained, outlined) and color prop',
      api: '<Button variant="contained" color="primary">Label</Button>',
    },
    {
      name: 'TextField',
      description: 'Form input with label, helper text, error state, and variants',
      api: '<TextField label="Label" variant="outlined" />',
    },
    {
      name: 'AppBar',
      description: 'Top app bar for navigation with Toolbar',
      api: '<AppBar position="static"><Toolbar><Typography>Title</Typography></Toolbar></AppBar>',
    },
    {
      name: 'Drawer',
      description: 'Side navigation panel with temporary, persistent, or permanent variants',
      api: '<Drawer open={open} onClose={handleClose}><List>...</List></Drawer>',
    },
    {
      name: 'Card',
      description: 'Card surface with CardContent, CardActions, CardHeader',
      api: '<Card><CardContent><Typography>Content</Typography></CardContent></Card>',
    },
    {
      name: 'Grid',
      description: '12-column responsive grid layout with container and item props',
      api: '<Grid container spacing={2}><Grid item xs={12} md={6}></Grid></Grid>',
    },
    {
      name: 'Typography',
      description: 'Text component with variant prop for different heading/body styles',
      api: '<Typography variant="h4" component="h1">Heading</Typography>',
    },
    {
      name: 'Dialog',
      description: 'Modal dialog with DialogTitle, DialogContent, DialogActions',
      api: '<Dialog open={open}><DialogTitle>Title</DialogTitle><DialogContent>...</DialogContent><DialogActions><Button>Close</Button></DialogActions></Dialog>',
    },
  ],
};
