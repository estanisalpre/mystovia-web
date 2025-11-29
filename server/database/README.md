# Instalación de Base de Datos

## Instrucciones

1. **Conectarse a MySQL:**
   ```bash
   mysql -u root -p
   ```

2. **Seleccionar la base de datos de tu servidor OT:**
   ```sql
   USE tu_base_de_datos;
   ```

3. **Ejecutar el schema:**
   ```sql
   source /ruta/completa/al/archivo/schemas.sql;
   ```

   O desde la línea de comandos:
   ```bash
   mysql -u root -p tu_base_de_datos < server/database/schemas.sql
   ```

## Verificación

Después de ejecutar el schema, verifica que las tablas se crearon correctamente:

```sql
SHOW TABLES;
```

Deberías ver las siguientes tablas nuevas:
- permissions
- role_permissions
- forum_categories
- forum_topics
- forum_comments
- forum_topic_votes
- news_categories
- news
- news_likes
- wiki_categories
- wiki_articles
- faq_categories
- faqs
- download_categories
- downloads
- rule_sections
- rules
- support_tickets
- support_responses

## Verificar Datos Iniciales

```sql
-- Ver permisos creados
SELECT * FROM permissions;

-- Ver roles configurados
SELECT * FROM role_permissions;

-- Ver categorías de foro
SELECT * FROM forum_categories;
```

## Asignar Rol de Super Admin

Para asignar el rol de Super Admin (group_id 10) a tu cuenta:

```sql
UPDATE accounts SET group_id = 10 WHERE id = TU_ID_DE_CUENTA;
```

O por email:
```sql
UPDATE accounts SET group_id = 10 WHERE email = 'tu-email@example.com';
```

## Roles Disponibles

- **group_id = 10**: Super Admin (acceso total)
- **group_id = 6**: Admin Foro (solo moderación de foro)
- **group_id = 1**: Usuario Normal (lectura y participación básica)
