import { createRootRoute, Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Layout, Menu, Switch } from 'antd'
import { ShoppingCartOutlined, AppstoreOutlined, HistoryOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons'
import { Loading } from '../components/Loading'
import { NotFound } from '../components/NotFound'
import { useTheme } from '../ThemeProvider'

const { Header, Content } = Layout

const RootLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDark, toggle } = useTheme()

  const menuItems = [
    {
      key: '/',
      label: 'Home',
      onClick: () => navigate({ to: '/' }),
    },
    {
      key: '/stock',
      icon: <AppstoreOutlined />,
      label: 'Stok',
      onClick: () => navigate({ to: '/stock' }),
    },
    {
      key: '/transaction',
      icon: <ShoppingCartOutlined />,
      label: 'Transaksi',
      onClick: () => navigate({ to: '/transaction' }),
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: 'Riwayat',
      onClick: () => navigate({ to: '/history' }),
    },
  ]

  // Get current selected key based on pathname
  const selectedKey = menuItems.find(item => item.key === location.pathname)?.key || '/'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#001529',
          padding: '0 24px',
        }}
      >
        <Link to="/">
          <div
            style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Kasirku
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={menuItems}
            style={{ flex: 1, minWidth: 0 }}
          />
          <Switch
            checked={isDark}
            onChange={toggle}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
          />
        </div>
      </Header>

      <Content style={{ padding: '24px 50px' }}>
        <Outlet />
      </Content>

      <TanStackRouterDevtools />
    </Layout>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
  pendingComponent: Loading,
  notFoundComponent: NotFound,
})