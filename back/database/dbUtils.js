/**
 * Utility functions for database synchronization and conflict resolution.
 */

const resolveDatabaseConflicts = async (sequelizeInstance) => {
    const queryInterface = sequelizeInstance.getQueryInterface();
    const models = Object.values(sequelizeInstance.models);

    for (const model of models) {
        const tableName = model.tableName;
        let tableExists;
        try {
            tableExists = await queryInterface.tableExists(tableName);
        } catch (err) {
            console.warn(`Error al verificar si la tabla ${tableName} existe:`, err.message);
            continue;
        }

        if (!tableExists) {
            console.log(`La tabla ${tableName} no existe en la BD. Se creará automáticamente durante sync.`);
            continue;
        }

        console.log(`Verificando estructura y posibles conflictos de datos en la tabla: ${tableName}...`);
        
        let dbColumns;
        try {
            dbColumns = await queryInterface.describeTable(tableName);
        } catch (err) {
            console.error(`Error al describir la tabla ${tableName}:`, err.message);
            continue;
        }

        let rowCount = 0;
        try {
            rowCount = await model.count();
        } catch (err) {
            console.warn(`No se pudo obtener el conteo de filas de ${tableName}:`, err.message);
            continue;
        }

        for (const [columnName, attributeDef] of Object.entries(model.rawAttributes)) {
            const columnExists = !!dbColumns[columnName];
            const typeStr = attributeDef.type.constructor.name.toUpperCase();

            if (!columnExists) {
                // Nueva columna NOT NULL sin valor por defecto en modelo, pero con filas en BD
                if (attributeDef.allowNull === false && attributeDef.defaultValue === undefined && rowCount > 0) {
                    let defaultVal = 'N/A';
                    if (typeStr.includes('INTEGER') || typeStr.includes('FLOAT') || typeStr.includes('DOUBLE') || typeStr.includes('DECIMAL') || typeStr.includes('NUMBER')) {
                        defaultVal = 0;
                    } else if (typeStr.includes('BOOLEAN')) {
                        defaultVal = false;
                    } else if (typeStr.includes('DATE')) {
                        defaultVal = '1970-01-01';
                    } else if (typeStr.includes('ENUM')) {
                        defaultVal = attributeDef.values && attributeDef.values.length > 0 ? attributeDef.values[0] : '';
                    } else if (typeStr.includes('JSON')) {
                        defaultVal = [];
                    }
                    
                    console.log(`[Estructura] Nueva columna NOT NULL detectada: ${tableName}.${columnName}. Inyectando valor por defecto temporal: ${defaultVal}`);
                    attributeDef.defaultValue = defaultVal;
                }
            } else {
                // Columna existente. Validar compatibilidad de datos existentes con el tipo del modelo
                if (rowCount > 0) {
                    const pkAttr = model.primaryKeyAttribute || 'id';
                    let rows = [];
                    try {
                        rows = await model.findAll({
                            attributes: [pkAttr, columnName],
                            raw: true
                        });
                    } catch (err) {
                        console.warn(`No se pudieron obtener los registros para validar conflictos en ${tableName}.${columnName}:`, err.message);
                        continue;
                    }

                    for (const row of rows) {
                        const pkVal = row[pkAttr];
                        const val = row[columnName];
                        let hasConflict = false;
                        let resolvedValue = val;

                        if (val === null || val === undefined) {
                            if (attributeDef.allowNull === false) {
                                hasConflict = true;
                                if (typeStr.includes('INTEGER') || typeStr.includes('FLOAT') || typeStr.includes('DOUBLE') || typeStr.includes('DECIMAL') || typeStr.includes('NUMBER')) {
                                    resolvedValue = 0;
                                } else if (typeStr.includes('BOOLEAN')) {
                                    resolvedValue = false;
                                } else if (typeStr.includes('DATE')) {
                                    resolvedValue = '1970-01-01';
                                } else if (typeStr.includes('ENUM')) {
                                    resolvedValue = attributeDef.defaultValue !== undefined ? attributeDef.defaultValue : (attributeDef.values && attributeDef.values.length > 0 ? attributeDef.values[0] : '');
                                } else if (typeStr.includes('JSON')) {
                                    resolvedValue = [];
                                } else {
                                    resolvedValue = 'N/A';
                                }
                            }
                        } else {
                            if (typeStr.includes('INTEGER') || typeStr.includes('FLOAT') || typeStr.includes('DOUBLE') || typeStr.includes('DECIMAL') || typeStr.includes('NUMBER')) {
                                const isNumeric = typeof val === 'number' || (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val)));
                                if (!isNumeric) {
                                    hasConflict = true;
                                    resolvedValue = attributeDef.allowNull === false ? 0 : null;
                                } else {
                                    resolvedValue = Number(val);
                                }
                            } else if (typeStr.includes('BOOLEAN')) {
                                const valStr = String(val).toLowerCase().trim();
                                const isValidBool = valStr === 'true' || valStr === 'false' || valStr === '1' || valStr === '0' || typeof val === 'boolean';
                                if (!isValidBool) {
                                    hasConflict = true;
                                    resolvedValue = attributeDef.allowNull === false ? false : null;
                                } else {
                                    resolvedValue = (valStr === 'true' || valStr === '1' || val === true);
                                }
                            } else if (typeStr.includes('DATE')) {
                                const timestamp = Date.parse(val);
                                if (isNaN(timestamp)) {
                                    hasConflict = true;
                                    resolvedValue = attributeDef.allowNull === false ? '1970-01-01' : null;
                                }
                            } else if (typeStr.includes('ENUM')) {
                                if (attributeDef.values && !attributeDef.values.includes(val)) {
                                    hasConflict = true;
                                    if (attributeDef.allowNull === false) {
                                        resolvedValue = attributeDef.defaultValue !== undefined ? attributeDef.defaultValue : (attributeDef.values.length > 0 ? attributeDef.values[0] : '');
                                    } else {
                                        resolvedValue = null;
                                    }
                                }
                            } else if (typeStr.includes('JSON')) {
                                if (typeof val === 'string') {
                                    try {
                                        JSON.parse(val);
                                        resolvedValue = val;
                                    } catch (e) {
                                        hasConflict = true;
                                        resolvedValue = attributeDef.allowNull === false ? [] : null;
                                    }
                                } else if (typeof val !== 'object') {
                                    hasConflict = true;
                                    resolvedValue = attributeDef.allowNull === false ? [] : null;
                                }
                            } else if (typeStr.includes('STRING') || typeStr.includes('TEXT') || typeStr.includes('CHAR')) {
                                const maxLen = attributeDef.type.options?.length || attributeDef.type._length;
                                if (maxLen && String(val).length > maxLen) {
                                    hasConflict = true;
                                    resolvedValue = attributeDef.allowNull === false ? 'N/A' : null;
                                }
                            }
                        }

                        if (hasConflict) {
                            console.log(`[Conflicto Detectado] Tabla: ${tableName}, Columna: ${columnName}, PK: ${pkVal}. Valor incompatible "${val}". Corrigiendo a: ${resolvedValue}`);
                            try {
                                await model.update(
                                    { [columnName]: resolvedValue },
                                    { where: { [pkAttr]: pkVal }, hooks: false, validate: false }
                                );
                            } catch (updateErr) {
                                console.error(`Error al actualizar fila con PK ${pkVal} en ${tableName}.${columnName}:`, updateErr.message);
                            }
                        }
                    }
                }

                // Si la columna es de tipo ENUM, asegurarnos de que la base de datos MySQL tenga los mismos enums que el modelo
                if (typeStr.includes('ENUM')) {
                    const dbType = dbColumns[columnName].type; // e.g. "ENUM('pending','rejected')"
                    const expectedEnumDefinition = `ENUM(${attributeDef.values.map(v => `'${v}'`).join(',')})`;
                    
                    const normalizeEnum = (str) => String(str).replace(/\s+/g, '').toUpperCase();
                    if (normalizeEnum(dbType) !== normalizeEnum(expectedEnumDefinition)) {
                        console.log(`[Estructura] Detectada discrepancia de ENUM en ${tableName}.${columnName}. DB: ${dbType}, Modelo: ${expectedEnumDefinition}. Ejecutando ALTER TABLE...`);
                        
                        const allowNullSql = attributeDef.allowNull === false ? 'NOT NULL' : 'NULL';
                        const defaultSql = attributeDef.defaultValue !== undefined ? `DEFAULT '${attributeDef.defaultValue}'` : '';
                        const alterQuery = `ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${columnName}\` ENUM(${attributeDef.values.map(v => `'${v}'`).join(',')}) ${allowNullSql} ${defaultSql};`;
                        
                        try {
                            await sequelizeInstance.query(alterQuery);
                            console.log(`[Estructura] Columna ENUM ${tableName}.${columnName} modificada exitosamente.`);
                        } catch (alterErr) {
                            console.error(`[Estructura] Error al ejecutar ALTER TABLE para modificar ENUM en ${tableName}.${columnName}:`, alterErr.message);
                        }
                    }
                }
            }
        }
    }
};

module.exports = {
    resolveDatabaseConflicts
};
